'use server';

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {adminDb, } from "@/libs/firebase-admin";
import {fetchModels} from "@/services/fetchModel";

interface IPlanOnServer {
  id: string;
  name: string;
  gem: number;
  startedAt: Date;
  endAt: Date;
}


export async function fetchUserUsedGem(userId: string): Promise<{usedGem: number, planGem: number}> {
  const userPlan = await fetchUserPlan(userId);
  const startDate = userPlan.startedAt;
  const endDate = userPlan.endAt;

  const models = await fetchModels();
  const modelCostByName = Object.fromEntries(
    models.map((m) => [m.name, m.cost])
  );

  const messagesRef = adminDb.collection("users").doc(userId).collection("messages");
  const snapshot = await messagesRef
    .where("createdAt", ">=", startDate)
    .where("createdAt", "<", endDate)
    .get()

  let usedGem = 0;

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const role = data.role as "user" | "model" | undefined;
    const tokens = typeof data.tokens === "number" ? data.tokens : 0;
    const modelName = (data.modelName ?? null) as string | null;

    if (!modelName || !role || tokens <= 0) {
      return;
    }

    const cost = modelCostByName[modelName];

    const unitCost = role === "user" ? cost.user : cost.model;

    usedGem += unitCost * tokens;
  });

  return {usedGem: usedGem, planGem: userPlan.gem}
}

export async function fetchUserPlan(userId: string): Promise<IPlanOnServer> {
  const now = new Date();

  const subscriptionsRef = adminDb.collection("users").doc(userId).collection("subscriptions");
  const snapshot = await subscriptionsRef
    .where("actionName", "==", "created")
    .where("startedAt", "<=", now)
    .where("endAt", ">", now)
    .orderBy("startedAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error("Any Subscription was not found!");
  }

  const subscriptionData = snapshot.docs[0].data() as {
    planId: string;
    createdAt: Timestamp;
    startedAt: Timestamp;
    endAt: Timestamp;
  };

  if (!subscriptionData.planId) {
    throw new Error("Subscription plan not found!");
  }

  const planSnapshot = await adminDb.collection("plans").doc(subscriptionData.planId).get();

  if (!planSnapshot.exists) {
    throw new Error("Subscription plan not found!");
  }

  const planData = planSnapshot.data() as { name: string; gem: number; price: number; };

  if(planData.price == 0){
    const createdDate = subscriptionData.createdAt.toDate();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / oneDayMs);

    const startedAt = new Date(createdDate);
    startedAt.setDate(startedAt.getDate() + daysDiff);

    const endAt = new Date(startedAt);
    endAt.setDate(endAt.getDate() + 1);

    return {
      id: subscriptionData.planId,
      name: planData.name,
      gem: planData.gem,
      startedAt: startedAt,
      endAt: endAt,
    };
  }else {
    return {
      id: subscriptionData.planId,
      name: planData.name,
      gem: planData.gem,
      startedAt: subscriptionData.startedAt.toDate(),
      endAt: subscriptionData.endAt.toDate(),
    }
  }
}