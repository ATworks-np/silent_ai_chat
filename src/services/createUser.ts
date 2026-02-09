"use server";

import { adminDb } from "@/libs/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {guestPlan} from "@/models/interfaces/plan";

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

    const subscriptionsRef = userDocRef.collection("subscriptions");
    await subscriptionsRef.add({
      actionName: "created",
      createdAt: FieldValue.serverTimestamp(),
      planId: guestPlan.id,
    });

    // 作成したデータを再取得
    docSnapshot = await userDocRef.get();
  }

  const data = docSnapshot.data();

  if (!data) {
    throw new Error("Failed to retrieve user data.");
  }

  // Next.jsのルール（プレーンなオブジェクトのみ）に合わせて変換して返すわよ！
  return {
    uid: uid,
    displayName: data.displayName ?? null,
    photoURL: data.photoURL ?? null,
    type: data.type ?? "none",
    // Timestamp型がある場合は、数値（ミリ秒）や文字列に変換するのが鉄則！
    createdAt: data.createdAt ? data.createdAt.toDate().getTime() : null,
  };
}