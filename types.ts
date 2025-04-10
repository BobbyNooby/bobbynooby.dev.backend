export type DiscordStatuses = "online" | "idle" | "dnd" | "offline" | "unknown";

export type ChatMessage = {
  created_at: string;
  name: string;
  message: string;
  rank: string;
};

export type RecievedChatMessage = {
  name: string;
  message: string;
  sessionId: string;
};
