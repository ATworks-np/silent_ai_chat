"use client";

import { useEffect } from "react";
import { userAtom } from "@/stores/user";
import { getAuth } from "firebase/auth";
import { useAtom } from "jotai";
import { User, guestUser } from "@/models/entities/user";
import type { IUserPlan } from "@/models/interfaces/user";
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

const fetchCurrentPlan = async (uid: string): Promise<IUserPlan | undefined> => {
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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnapshot = await getDoc(userDocRef);
        const userData = docSnapshot.data();
        const plan = await fetchCurrentPlan(userDocRef.id);
        setUser(
          new User({
            uid: userDocRef.id,
            token,
            photoURL: userData?.photoURL,
            displayName: userData?.displayName,
            type: userData?.type,
            plan,
          })
        );
      } else {
        setUser(guestUser);
      }
    });

    return () => unsubscribe();
  }, [setUser]); // user を依存に入れない

  const refreshUserData = async () => {
    if (!user.props.uid) return;
    const userDocRef = doc(db, "users", user.props.uid);
    const docSnapshot = await getDoc(userDocRef);
    const userData = docSnapshot.data();
    const plan = await fetchCurrentPlan(userDocRef.id);
    setUser(
      new User({
        uid: user.props.uid,
        token: user.props.token,
        photoURL: userData?.photoURL,
        displayName: userData?.displayName,
        type: userData?.type,
        plan,
      })
    );
  };

  return { user, setUser, refreshUserData };
};

export default useUser;
