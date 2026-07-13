export interface MessageDTO {
  _id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  attachments: any[];
  status: "sent" | "delivered" | "read";
  replyTo?: string;
  createdAt: string;
}
