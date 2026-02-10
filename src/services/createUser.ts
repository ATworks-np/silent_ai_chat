"use server";

import { adminDb } from "@/libs/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {guestPlan, standardPlan} from "@/models/interfaces/plan";

interface SyncUserParams {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

export async function syncUserRecord({ uid, displayName, photoURL }: SyncUserParams) {
  const userDocRef = adminDb.collection("users").doc(uid);
  let docSnapshot = await userDocRef.get();

  if (!docSnapshot.exists) {
    // 新規作成
    await userDocRef.set({
      displayName: displayName ?? null,
      photoURL: photoURL ?? null,
      type: "none",
      createdAt: FieldValue.serverTimestamp(),
    });

    const batch = adminDb.batch(); // adminSDKなら adminDb.batch()

    const subRef = userDocRef.collection("subscriptions").doc();
    const txRef = userDocRef.collection("transactions").doc();
    const eventRef = userDocRef.collection("transactionEvents").doc();

    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1); // 現在の月に+1するわ

    batch.set(subRef, {
      id: subRef.id,
      planId: guestPlan.id,
      status: "active",
      actionName: "created",

      latestTransactionId: txRef.id,

      currentPeriodStart: now,
      currentPeriodEnd: oneMonthLater,
      createdAt: now,
      startedAt: now,
      endAt: new Date(2099, 11, 31, 23, 59, 59, 999),
    });

    batch.set(txRef, {
      id: txRef.id,
      planId: guestPlan.id,
      subscriptionId: subRef.id,

      amount: 0,
      currency: 'jpy',
      status: 'succeeded',

      provider: "none",
      providerTransactionId: "initial_guest_setup",

      lastEventId: eventRef.id,
      updatedAt: now,
      createdAt: now,
    });

    batch.set(eventRef, {
      id: eventRef.id,
      transactionId: txRef.id,

      type: "PAYMENT_SUCCEEDED",
      status: "success",

      payload: {
        amount: 0,
        note: "Initial guest plan creation",
      },

      createdAt: now,
    });

    await batch.commit();

    docSnapshot = await userDocRef.get();
  }

  const data = docSnapshot.data();

  if (!data) {
    throw new Error("Failed to retrieve user data.");
  }

  return {
    uid: uid,
    displayName: data.displayName ?? null,
    photoURL: data.photoURL ?? null,
    type: data.type ?? "none",
    createdAt: data.createdAt ? data.createdAt.toDate().getTime() : null,
  };
}

export async function updateUser({ uid, displayName, photoURL }: SyncUserParams): Promise<SyncUserParams> {
  const userDocRef = adminDb.collection("users").doc(uid);

  // 1. ドキュメントの存在確認（updateはドキュメントがないとエラーになるから）
  const docSnapshot = await userDocRef.get();

  if (!docSnapshot.exists) {
    // 存在しない場合はエラーを投げるか、nullを返す設計にするべきよ
    throw new Error(`User not found: ${uid}`);
  }

  // 2. 更新実行
  await userDocRef.update({
    displayName: displayName ?? null,
    photoURL: photoURL ?? null,
  });

  // 3. 【ここが重要！】更新した内容をオブジェクトとして返す
  // Firestoreから再取得しなくても、今セットした値はわかっているからね
  return {
    uid,
    displayName: displayName ?? null,
    photoURL: photoURL ?? null,
  };
}

export async function createStandardSubscription({uid}: {uid: string}) {
  const userDocRef = adminDb.collection("users").doc(uid);
  const docSnapshot = await userDocRef.get();

  if (docSnapshot.exists) {
    const batch = adminDb.batch();

    const subRef = userDocRef.collection("subscriptions").doc();
    const txRef = userDocRef.collection("transactions").doc();
    const eventRef = userDocRef.collection("transactionEvents").doc();

    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1); // 現在の月に+1するわ

    batch.set(subRef, {
      id: subRef.id,
      planId: standardPlan.id,
      status: "active",
      actionName: "created",

      latestTransactionId: txRef.id,

      createdAt: now,
      startedAt: now,
      endAt:  oneMonthLater,
    });

    batch.set(txRef, {
      id: txRef.id,
      planId: guestPlan.id,
      subscriptionId: subRef.id,

      amount: 0,
      currency: 'jpy',
      status: 'succeeded',

      provider: "none",
      providerTransactionId: "initial_standard_setup",

      lastEventId: eventRef.id,
      updatedAt: now,
      createdAt: now,
    });

    batch.set(eventRef, {
      id: eventRef.id,
      transactionId: txRef.id,

      type: "PAYMENT_SUCCEEDED",
      status: "success",

      payload: {
        amount: 0,
        note: "Initial standard plan creation",
      },

      createdAt: now,
    });

    await batch.commit();
  }
};