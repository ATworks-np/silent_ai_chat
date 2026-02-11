import type { Timestamp } from "firebase/firestore";

export interface ArchiveMessage {
  messageId: string;
  content: string;
  createdAt: Timestamp | null;
}
