"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  orderBy,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/libs/firebase";
import useUser from "@/hooks/useUser";

interface SubscriptionDoc {
  actionName: string;
  createdAt: Timestamp;
  planId: string;
}

interface PlanDoc {
  gem: number;
}

interface ModelCost {
  user: number;
  model: number;
}

interface ModelDoc {
  name: string;
  cost: ModelCost;
}

interface GemUsageSummary {
  maxGem: number | null;
  usedGem: number | null;
  remainingGem: number | null;
}

interface UseUserGemBalanceState extends GemUsageSummary {
  loading: boolean;
  error: string | null;
}

export function useUserGemBalance(): UseUserGemBalanceState {
  const { user } = useUser();
  const [state, setState] = useState<UseUserGemBalanceState>({
    maxGem: null,
    usedGem: null,
    remainingGem: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const uid = user.props.uid;

    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        if (!uid) {
          setState({
            maxGem: null,
            usedGem: null,
            remainingGem: null,
            loading: false,
            error: null,
          });
          return;
        }

        const subscriptionsRef = collection(db, "users", uid, "subscriptions");
        const subscriptionQuery = query(
          subscriptionsRef,
          where("actionName", "==", "created"),
          orderBy("createdAt", "desc"),
          limit(1),
        );

        const subscriptionSnapshot = await getDocs(subscriptionQuery);

        if (cancelled) return;

        if (subscriptionSnapshot.empty) {
          setState({
            maxGem: null,
            usedGem: null,
            remainingGem: null,
            loading: false,
            error: null,
          });
          return;
        }

        const subscriptionData = subscriptionSnapshot.docs[0].data() as SubscriptionDoc;

        if (!subscriptionData.createdAt || !subscriptionData.planId) {
          setState({
            maxGem: null,
            usedGem: null,
            remainingGem: null,
            loading: false,
            error: null,
          });
          return;
        }

        const planRef = doc(db, "plans", subscriptionData.planId);
        const planSnapshot = await getDoc(planRef);

        if (cancelled) return;

        if (!planSnapshot.exists()) {
          setState({
            maxGem: null,
            usedGem: null,
            remainingGem: null,
            loading: false,
            error: null,
          });
          return;
        }

        const planData = planSnapshot.data() as PlanDoc;
        const maxGem = planData.gem;

        if (maxGem === null) {
          setState({
            maxGem: null,
            usedGem: null,
            remainingGem: null,
            loading: false,
            error: null,
          });
          return;
        }

        const modelsRef = collection(db, "models");
        const modelsSnapshot = await getDocs(modelsRef);

        if (cancelled) return;

        const modelCostByName = new Map<string, ModelCost>();
        modelsSnapshot.forEach((docSnapshot) => {
          const modelData = docSnapshot.data() as ModelDoc;
          if (!modelData.name || !modelData.cost) return;
          modelCostByName.set(modelData.name, modelData.cost);
        });

        const startDate = subscriptionData.createdAt.toDate();
        const endDate = new Date(startDate.getTime());
        endDate.setMonth(endDate.getMonth() + 1);

        const messagesRef = collection(db, "users", uid, "messages");
        const messagesQuery = query(
          messagesRef,
          where("createdAt", ">=", startDate),
          where("createdAt", "<", endDate),
        );

        const messagesSnapshot = await getDocs(messagesQuery);

        if (cancelled) return;

        let usedGem = 0;

        console.log(messagesSnapshot.docs.length)

        messagesSnapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          const role = data.role as "user" | "model" | undefined;
          const tokens = typeof data.tokens === "number" ? data.tokens : 0;
          const modelName = (data.modelName ?? null) as string | null;

          if (!modelName || !role || tokens <= 0) {
            return;
          }

          const cost = modelCostByName.get(modelName);

          if (!cost) {
            return;
          }

          const unitCost = role === "user" ? cost.user : cost.model;

          if (typeof unitCost !== "number") {
            return;
          }

          usedGem += unitCost * tokens;
        });

        const remainingGem = Math.max(0, maxGem - usedGem);

        setState({
          maxGem,
          usedGem,
          remainingGem,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;

        const message = err instanceof Error ? err.message : "残りジェムの取得に失敗しました";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [user.props.uid]);

  return state;
}
