"use server";

import { adminDb } from "@/libs/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface SyncUserParams {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

export async function syncUserRecord({ uid, displayName, photoURL }: SyncUserParams) {
  const userDocRef = adminDb.collection("users").doc(uid);
  const docSnapshot = await userDocRef.get();

  if (!docSnapshot.exists) {
    // 新規作成
    await userDocRef.set({
      displayName: displayName ?? null,
      photoURL: photoURL ?? null,
      type: "none",
      createdAt: FieldValue.serverTimestamp(),
    });

    const subscriptionsRef = userDocRef.collection("subscriptions");
    await subscriptionsRef.add({
      actionName: "created",
      createdAt: FieldValue.serverTimestamp(),
      planId: "guest_plan_id", // guestPlan.id
    });
  }

  const updatedDoc = await userDocRef.get();
  return updatedDoc.data();
}