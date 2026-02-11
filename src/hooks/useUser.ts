import { useAtom } from "jotai";
import {useCallback, useEffect, useState} from "react";
import {getAuth, signInAnonymously,User as FirebaseUser, UserInfo, type Auth} from "firebase/auth";
import { userAtom } from "@/stores/user";
import { User, guestUser } from "@/models/entities/user";
import type { IPlan } from "@/models/interfaces/plan";
import { guestPlan } from "@/models/interfaces/plan";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query, Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/libs/firebase";
import {syncUserRecord} from "@/services/createUser";

let isInitializing = false;

const fetchCurrentPlan = async (uid: string): Promise<IPlan | undefined> => {
  const subscriptionsRef = collection(db, "users", uid, "subscriptions");
  const subscriptionQuery = query(
    subscriptionsRef,
    where("actionName", "==", "created"),
    orderBy("createdAt", "desc"),
    limit(1),
  );

  const subscriptionSnapshot = await getDocs(subscriptionQuery);

  if (subscriptionSnapshot.empty) {
    return undefined;
  }

  const subscriptionData = subscriptionSnapshot.docs[0].data() as {
    planId: string;
    createdAt: Timestamp;
  };

  if (!subscriptionData.planId) {
    return undefined;
  }

  const planRef = doc(db, "plans", subscriptionData.planId);
  const planSnapshot = await getDoc(planRef);

  if (!planSnapshot.exists()) {
    return undefined;
  }

  const planData = planSnapshot.data() as { name?: string; gem?: number };

  if (typeof planData.name !== "string" || typeof planData.gem !== "number") {
    return undefined;
  }

  return {
    id: planRef.id,
    name: planData.name,
    gem: planData.gem,
    createdAt: subscriptionData.createdAt,
  };
};

function getProfile(firebaseUser: FirebaseUser){
  const googleProfile = firebaseUser.providerData.find(
    (profile: UserInfo) => profile.providerId === "google.com"
  );

  return {
    displayName: googleProfile?.displayName ?? firebaseUser.displayName,
    photoURL: googleProfile?.photoURL ?? firebaseUser.photoURL,
  };
}

const waitForAuth = (auth: Auth): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    // すでに currentUser があるなら即返す
    if (auth.currentUser) return resolve(auth.currentUser);

    // ない場合は、一度だけ状態変化を監視して解決する
    const unsubscribe = auth.onAuthStateChanged((user: FirebaseUser | null) => {
      unsubscribe();
      resolve(user);
    });
  });
};

const useUser = () => {
  const [user, setUser] = useAtom(userAtom);

  // ユーザー情報を最新の状態に更新する関数
  const refresh = useCallback(async (force = false) => {

    if (!force) {
      if (isInitializing || (user && user.props.uid)) return;
    }
    isInitializing = true;

    const auth = getAuth();
    let firebaseUser = await waitForAuth(auth);

    try {
      // 1. ログインしていない場合は匿名ログインを実行
      if (!firebaseUser) {
        console.log("No user found. Signing in anonymously...");
        const userCredential = await signInAnonymously(auth);
        firebaseUser = userCredential.user;
      }

      if (!firebaseUser) return;
      console.log(firebaseUser);
      const {displayName, photoURL} = getProfile(firebaseUser);

      // 2. データベースとユーザー情報を同期
      const userData = await syncUserRecord({
        uid: firebaseUser.uid,
        displayName: displayName,
        photoURL: photoURL,
      });

      // 3. 各種情報の取得（トークン・プラン）
      const token = await firebaseUser.getIdToken(true); // 強制リフレッシュ
      const plan = await fetchCurrentPlan(firebaseUser.uid);

      if (!plan) return;

      // 4. JotaiのStateを更新
      setUser(
        new User({
          uid: firebaseUser.uid,
          token,
          photoURL: photoURL,
          displayName: displayName,
          type: userData?.type,
          plan: plan,
        })
      );
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  }, [user, setUser]);

  // 初回マウント時に実行
  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, setUser, refresh };
};

export default useUser;
