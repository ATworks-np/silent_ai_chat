export interface UserMessage {
  id: string;
  content: string;
}

export interface HighlightedSelection {
  messageId: string;
  text: string;
  childMessageId: string;
}
