import { useAtom } from "jotai";
import {useEffect, useState} from "react";
import { getAuth, signInAnonymously } from "firebase/auth";
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
  setDoc,
  where, serverTimestamp, addDoc,
} from "firebase/firestore";
import { db } from "@/libs/firebase";
import {syncUserRecord} from "@/services/createUser";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let anonymousSignInStarted = false;

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

const useUser = () => {
  const [user, setUser] = useAtom(userAtom);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = auth.onIdTokenChanged(async (firebaseUser) => {
      console.log('onAuthStateChange', firebaseUser);
      // 1. ユーザーが存在しない場合のみ、匿名ログインを試みる
      if (!firebaseUser) {
        if (!anonymousSignInStarted) {
          anonymousSignInStarted = true;
          try {
            console.log("No user found. Starting anonymous sign-in...");
            await signInAnonymously(auth);
            // ここで return しても、ログイン成功時に再度この onAuthStateChanged が呼ばれるから大丈夫！
          } catch (error) {
            console.error("Failed to sign in anonymously", error);
            anonymousSignInStarted = false;
          }
        }
        return;
      }


      const userData = await syncUserRecord({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });

      const token = await firebaseUser.getIdToken();
      const plan = await fetchCurrentPlan(firebaseUser.uid);

      if(!plan){
        return;
      }

      setUser(
        new User({
          uid: firebaseUser.uid,
          token,
          photoURL: userData?.photoURL,
          displayName: userData?.displayName,
          type: userData?.type,
          plan: plan,
        })
      );
    });

    return () => unsubscribe();
  }, [setUser]);

  return { user, setUser };
};

export default useUser;
