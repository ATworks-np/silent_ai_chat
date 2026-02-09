import { useAtom } from "jotai";
import { useEffect } from "react";
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

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (!docSnapshot.exists()) {
          await setDoc(userDocRef, {
            displayName: firebaseUser.displayName ?? null,
            photoURL: firebaseUser.photoURL ?? null,
            type: "guest",
          });

          // 初回ゲスト作成時に subscriptions に created レコードを追加
          const subscriptionsRef = collection(db, "users", userDocRef.id, "subscriptions");
          await addDoc(subscriptionsRef, {
            actionName: "created",
            createdAt: serverTimestamp(),
            planId: guestPlan.id,
          });
        }

        const userData = (await getDoc(userDocRef)).data();
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
        try {
          if (!anonymousSignInStarted) {
            anonymousSignInStarted = true;
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Failed to sign in anonymously", error);
          setUser(guestUser);
        }
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
