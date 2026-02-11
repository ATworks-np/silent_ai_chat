import type { Timestamp } from "firebase/firestore";

export interface MessageDoc {
  // メッセージ本体
  role: "user" | "model";
  content: string ;
  tokens: number;
  createdAt: Timestamp | null;

  // ツリー構造のための情報
  messageId: string;
  parentMessageId: string | null;
  sourceUserMessageId: string | null;

  // モデルメッセージに紐づく「次にするアクション」候補
  // user メッセージの場合は null
  actions: string[] | null;

  // このメッセージ生成時に使用したモデル名
  // user / model 双方で、このメッセージ生成時に使用したモデル名を記録する
  modelName: string | null;

  // アーカイブフラグ（ルートメッセージのみ使用）
  archive?: boolean;

  // 論理削除フラグ
  deleted?: boolean;
}