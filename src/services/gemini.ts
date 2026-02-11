'use server';

import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/libs/firebase-admin";
import type { GeminiTokenUsage } from "@/hooks/useGemini";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {fetchUserUsedGem} from "@/services/fetchUser";
import {MessageDoc} from "@/models/interfaces/message";

interface conversationPersistenceParams {
  userId: string;
  userContent?: string;
  assistantContent: string;
  tokenUsage: GeminiTokenUsage;
  userMessageId: string;
  assistantMessageId: string;
  parentMessageId?: string;
  actions: string[];
  modelName: string;
}

export async function conversationPersistence(params: conversationPersistenceParams) {
  const batch = adminDb.batch();
  const messagesCollection = adminDb.collection("users").doc(params.userId).collection("messages");
  const userMessageDocRef = messagesCollection.doc();
  const modelMessageDocRef= messagesCollection.doc();

  if(!params.userContent) return ;

  const userMessage: MessageDoc = {
    role: "user",
    content: params.userContent,
    tokens: params.tokenUsage.promptTokenCount,
    createdAt:  FieldValue.serverTimestamp(),
    messageId: params.userMessageId,
    parentMessageId: params.parentMessageId || null,
    sourceUserMessageId: null,
    actions: null,
    modelName: params.modelName,
  };

  const modelMessage: MessageDoc = {
    role: "model",
    content: params.assistantContent,
    tokens: params.tokenUsage.candidatesTokenCount + params.tokenUsage.thoughtsTokenCount,
    createdAt:  FieldValue.serverTimestamp(),
    messageId: params.assistantMessageId,
    parentMessageId: params.parentMessageId || null,
    sourceUserMessageId: params.userMessageId || null,
    actions: params.actions && params.actions.length > 0 ? params.actions : null,
    modelName: params.modelName,
  };

  batch.set(userMessageDocRef, userMessage)
  batch.set(modelMessageDocRef, modelMessage)

  await batch.commit();
}

interface sendGeminiParams{
  userId: string;
  parentId: string | undefined;
  modelName: string;
  finalSystemPrompt: string;
  contents: {
    role: "user" | "model"
    parts: {
      text: string
    }[]
  }[]
}

// アーカイブの更新
export async function updateMessageArchive(userId: string, messageId: string, archive: boolean): Promise<void> {
  const messagesCollection = adminDb.collection("users").doc(userId).collection("messages");
  const snapshot = await messagesCollection.where("messageId", "==", messageId).get();
  
  if (snapshot.empty) {
    throw new Error("Message not found");
  }
  
  const batch = adminDb.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { archive });
  });
  await batch.commit();
}

// メッセージツリーの削除（ルートメッセージとその配下すべて）
export async function deleteMessageTree(userId: string, rootMessageId: string): Promise<void> {
  const messagesCollection = adminDb.collection("users").doc(userId).collection("messages");
  const allMessagesSnapshot = await messagesCollection.get();
  
  const allDocs = allMessagesSnapshot.docs.map((doc) => ({
    ref: doc.ref,
    data: doc.data() as MessageDoc,
  }));
  
  // ルートメッセージのmessageIdに関連するすべてのメッセージを収集
  const toDelete = new Set<string>();
  
  // ルートメッセージ自体を追加
  toDelete.add(rootMessageId);
  
  // 子孫を再帰的に収集
  const collectDescendants = (parentId: string) => {
    allDocs.forEach((doc) => {
      if (doc.data.parentMessageId === parentId && !toDelete.has(doc.data.messageId)) {
        toDelete.add(doc.data.messageId);
        collectDescendants(doc.data.messageId);
      }
    });
  };
  
  collectDescendants(rootMessageId);
  
  // 削除対象のドキュメントを論理削除
  const batch = adminDb.batch();
  allDocs.forEach((doc) => {
    if (toDelete.has(doc.data.messageId)) {
      batch.update(doc.ref, { deleted: true });
    }
  });
  
  await batch.commit();
}

export async function sendGemini(params: sendGeminiParams):Promise<conversationPersistenceParams | undefined> {
  const {usedGem, planGem} = await fetchUserUsedGem(params.userId);
  if(planGem - usedGem <= 0 ) throw new Error("You've reached your monthly gem limit");

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: params.modelName,
    systemInstruction: params.finalSystemPrompt,
  });

  const result = await model.generateContent({ contents: params.contents });

  const userMessageId = `user-${Date.now()}-${Math.random()}`;
  const assistantMessageId = `assistant-${Date.now()}-${Math.random()}`;

  const response = result.response;
  const rawText = response.text();

  const delimiter = "次にするアクション:";
  let text = rawText;
  console.log(rawText);
  let suggestedActions: string[] = [];

  const delimiterIndex = rawText.indexOf(delimiter);

  if (delimiterIndex !== -1) {
    text = rawText.slice(0, delimiterIndex).trim();

    const actionsPart = rawText.slice(delimiterIndex + delimiter.length).trim();
    const actionLines = actionsPart
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    suggestedActions = actionLines.slice(0, 2);
  }

  const usage = (response as unknown as {
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      thoughtsTokenCount?: number;
      totalTokenCount?: number;
    };
  }).usageMetadata;

  if(usage) {
    const tokenUsage: GeminiTokenUsage = {
      promptTokenCount: usage.promptTokenCount ?? 0,
      candidatesTokenCount: usage.candidatesTokenCount ?? 0,
      thoughtsTokenCount: usage.thoughtsTokenCount ?? 0,
      totalTokenCount: usage.totalTokenCount ?? 0,
    };

    const result:conversationPersistenceParams = {
        userId: params.userId,
        userContent: params.contents.at(-1)?.parts.at(-1)?.text,
        assistantContent: text,
        tokenUsage: tokenUsage,
        userMessageId: userMessageId,
        assistantMessageId: assistantMessageId,
        parentMessageId: params.parentId,
        actions: suggestedActions,
        modelName: params.modelName,
      }
    await conversationPersistence(result)

    return result;
  }

  return undefined;
}
