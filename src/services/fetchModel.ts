import {adminDb,} from "@/libs/firebase-admin";

interface IModelOnServer {
  id: string;
  cost: {
    user: number;
    model: number;
  };
  name: string;
  displayName: string;
  provider: string;
}


export async function fetchModels(): Promise<IModelOnServer[]> {
  const snapshot = await adminDb.collection("models").get();

  return snapshot.docs.map(doc => {
    return {
      id: doc.id,       // ドキュメントID (必須よね？)
      ...doc.data(),    // 中身を展開
    } as IModelOnServer;
  });
}