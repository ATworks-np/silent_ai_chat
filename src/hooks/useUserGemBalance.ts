"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/libs/firebase";
import {useAtom} from "jotai";
import {userAtom} from "@/stores/user";
import {fetchUserUsedGem} from "@/services/fetchUser";

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

export interface UseUserGemBalanceReturn extends UseUserGemBalanceState {
  refresh: () => void;
}

export function useUserGemBalance(): UseUserGemBalanceReturn {
  const [user] = useAtom(userAtom);
  const [state, setState] = useState<UseUserGemBalanceState>({
    maxGem: null,
    usedGem: null,
    remainingGem: null,
    loading: false,
    error: null,
  });

  const [reloadKey, setReloadKey] = useState(0);

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

        // useUser から現在のプランを取得して最大 gem を決定
        const currentPlan = user.props.plan;
        const maxGem = currentPlan?.gem ?? null;

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

        // const modelsRef = collection(db, "models");
        // const modelsSnapshot = await getDocs(modelsRef);
        //
        // if (cancelled) return;
        //
        // const modelCostByName = new Map<string, ModelCost>();
        // modelsSnapshot.forEach((docSnapshot) => {
        //   const modelData = docSnapshot.data() as ModelDoc;
        //   if (!modelData.name || !modelData.cost) return;
        //   modelCostByName.set(modelData.name, modelData.cost);
        // });
        //
        // const startDate = currentPlan.createdAt.toDate();
        // const endDate = new Date(startDate.getTime());
        // endDate.setMonth(endDate.getMonth() + 1);
        //
        // const messagesRef = collection(db, "users", uid, "messages");
        // const messagesQuery = query(
        //   messagesRef,
        //   where("createdAt", ">=", startDate),
        //   where("createdAt", "<", endDate),
        // );
        //
        // const messagesSnapshot = await getDocs(messagesQuery);
        //
        // if (cancelled) return;
        //
        // let usedGem = 0;
        //
        // messagesSnapshot.forEach((docSnapshot) => {
        //   const data = docSnapshot.data();
        //   const role = data.role as "user" | "model" | undefined;
        //   const tokens = typeof data.tokens === "number" ? data.tokens : 0;
        //   const modelName = (data.modelName ?? null) as string | null;
        //
        //   if (!modelName || !role || tokens <= 0) {
        //     return;
        //   }
        //
        //   const cost = modelCostByName.get(modelName);
        //
        //   if (!cost) {
        //     return;
        //   }
        //
        //   const unitCost = role === "user" ? cost.user : cost.model;
        //
        //   if (typeof unitCost !== "number") {
        //     return;
        //   }
        //
        //   usedGem += unitCost * tokens;
        // });

        const {usedGem, } = await fetchUserUsedGem(uid);

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
  }, [user.props.uid, reloadKey]);

  const refresh = () => {
    setReloadKey((prev) => prev + 1);
  };

  return {
    ...state,
    refresh,
  };
}
