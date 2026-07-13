// src/services/conversation.service.ts
import { Conversation } from "../models/Conversation.model";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";

/**
 * Unified list: existing conversations (only with active members)
 * + active clinic staff jinke saath abhi conversation nahi hai
 */
export async function getUnifiedChatList(
  currentUserId: string,
  clinicId: string,
) {
  // Step 1: existing conversations, sirf unke saath jo abhi bhi active hain
  const conversations = await Conversation.find({
    clinicId,
    members: currentUserId,
  })
    .populate({
      path: "members",
      select: "name avatarUrl isOnline role isActive",
      match: { isActive: true }, // deactivated members ko populate hi mat karo
    })
    .populate("lastMessage")
    .sort({ lastMessageAt: -1 });

  // direct conversations jinka doosra member ab deactivated ho chuka hai, unhe filter kar do
  const validConversations = conversations.filter((c) => {
    if (c.type === "group") return true; // groups me kayi members hote hain, alag handle karenge
    // direct chat: doosra member ab bhi active hona chahiye
    const otherMember = c.members.find(
      (m: any) => m._id.toString() !== currentUserId,
    );
    return !!otherMember;
  });

  const conversationPartnerIds = new Set(
    validConversations
      .filter((c) => c.type === "direct")
      .map((c) => {
        const other = c.members.find(
          (m: any) => m._id.toString() !== currentUserId,
        );
        return other?._id.toString();
      }),
  );

  // Step 2: active clinic staff jinke saath abhi conversation nahi hai
  const allActiveStaff = await User.find({
    clinicId,
    isActive: true,
    _id: { $ne: currentUserId },
  }).select("_id name avatarUrl role isOnline");

  const staffWithoutConversation = allActiveStaff.filter(
    (staff) => !conversationPartnerIds.has(staff._id.toString()),
  );

  return {
    conversations: validConversations,
    staffWithoutConversation, // frontend inhe "start chatting" entries ki tarah dikhayega
  };
}

/**
 * Lazy find-or-create - sirf tab call hota hai jab pehla message bheja jaye
 */
export async function findOrCreateDirectConversation(
  currentUserId: string,
  otherUserId: string,
  clinicId: string,
) {
  if (currentUserId === otherUserId) {
    throw new AppError("Cannot create a conversation with yourself", 400);
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser || !otherUser.isActive) {
    throw new AppError("This user is not available", 404);
  }

  const existing = await Conversation.findOne({
    clinicId,
    type: "direct",
    members: { $all: [currentUserId, otherUserId], $size: 2 },
  });

  if (existing) return existing;

  return Conversation.create({
    clinicId,
    type: "direct",
    members: [currentUserId, otherUserId],
    createdBy: currentUserId,
  });
}
