// src/types/socket.types.ts
export interface MessageDTO {
  _id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments: {
    url: string;
    type: "image" | "video" | "document" | "audio" | "file";
    fileName: string;
    fileSize: number;
    mimeType: string;
  }[];
  status: "sent" | "delivered" | "read";
  replyTo?: string;
  createdAt: string;
}

export interface SendMessagePayload {
  conversationId: string;
  text?: string;
  attachments?: MessageDTO["attachments"];
  replyTo?: string;
}

export interface TypingPayload {
  conversationId: string;
}

export interface ReadReceiptPayload {
  conversationId: string;
  messageId: string;
}

// Server -> Client events
export interface ServerToClientEvents {
  "message:new": (msg: MessageDTO) => void;
  "message:read": (data: {
    conversationId: string;
    messageId: string;
    userId: string;
  }) => void;
  "typing:start": (data: { conversationId: string; userId: string }) => void;
  "typing:stop": (data: { conversationId: string; userId: string }) => void;
  "user:online": (userId: string) => void;
  "user:offline": (userId: string) => void;
  "force:logout": (data: { reason: string }) => void;
  error: (data: { context: string; message: string }) => void;
}

// Client -> Server events
export interface ClientToServerEvents {
  "message:send": (payload: SendMessagePayload) => void;
  "message:markRead": (payload: ReadReceiptPayload) => void;
  "typing:start": (payload: TypingPayload) => void;
  "typing:stop": (payload: TypingPayload) => void;
}

// data attached to socket after auth middleware
export interface SocketData {
  user: {
    id: string;
    clinicId: string;
    role: string;
    name: string;
  };
}
