// src/services/conversation.service.ts
import { Message } from "../models/Message.model";
import { Conversation } from "../models/Conversation.model";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";

/**
 * Unified list: existing conversations (only with active members)
 * + active clinic staff jinke saath abhi conversation nahi hai
 */
// export async function getUnifiedChatList(
//   currentUserId: string,
//   clinicId: string,
// ) {
//   // Step 1: existing conversations, sirf unke saath jo abhi bhi active hain
//   const conversations = await Conversation.find({
//     clinicId,
//     members: currentUserId,
//   })
//     .populate({
//       path: "members",
//       select: "name avatarUrl isOnline role isActive",
//       match: { isActive: true }, // deactivated members ko populate hi mat karo
//     })
//     .populate("lastMessage")
//     .sort({ lastMessageAt: -1, createdAt: -1 });

//   // direct conversations jinka doosra member ab deactivated ho chuka hai, unhe filter kar do
//   const validConversations = conversations.filter((c) => {
//     if (c.type === "group") return true; // groups me kayi members hote hain, alag handle karenge
//     // direct chat: doosra member ab bhi active hona chahiye
//     const otherMember = c.members.find(
//       (m: any) => m._id.toString() !== currentUserId,
//     );
//     return !!otherMember;
//   });

//   const conversationPartnerIds = new Set(
//     validConversations
//       .filter((c) => c.type === "direct")
//       .map((c) => {
//         const other = c.members.find(
//           (m: any) => m._id.toString() !== currentUserId,
//         );
//         return other?._id.toString();
//       }),
//   );

//   // Step 2: active clinic staff jinke saath abhi conversation nahi hai
//   const allActiveStaff = await User.find({
//     clinicId,
//     isActive: true,
//     _id: { $ne: currentUserId },
//   }).select("_id name avatarUrl role isOnline");

//   const staffWithoutConversation = allActiveStaff.filter(
//     (staff) => !conversationPartnerIds.has(staff._id.toString()),
//   );

//   return {
//     conversations: validConversations,
//     staffWithoutConversation, // frontend inhe "start chatting" entries ki tarah dikhayega
//   };
// }

// src/services/conversation.service.ts (update existing function)
export async function getUnifiedChatList(
  currentUserId: string,
  clinicId: string,
) {
  const conversations = await Conversation.find({
    clinicId,
    members: currentUserId,
  })
    .populate({
      path: "members",
      select: "name avatarUrl isOnline role isActive",
      match: { isActive: true },
    })
    .populate("lastMessage")
    .sort({ lastMessageAt: -1 });

  const validConversations = conversations.filter((c) => {
    if (c.type === "group") return true;
    const otherMember = c.members.find(
      (m: any) => m._id.toString() !== currentUserId,
    );
    return !!otherMember;
  });

  // naya - har conversation ke liye unread count parallel me fetch karo
  const conversationsWithUnread = await Promise.all(
    validConversations.map(async (c) => {
      const unreadCount = await Message.countDocuments({
        conversationId: c._id,
        senderId: { $ne: currentUserId }, // apne khud ke messages count nahi karne
        readBy: { $ne: currentUserId }, // jo abhi tak read nahi kiye
        isDeleted: { $ne: true },
      });

      return {
        ...c.toObject(),
        unreadCount,
      };
    }),
  );

  const conversationPartnerIds = new Set(
    conversationsWithUnread
      .filter((c) => c.type === "direct")
      .map((c) => {
        const other = c.members.find(
          (m: any) => m._id.toString() !== currentUserId,
        );
        return other?._id.toString();
      }),
  );

  const allActiveStaff = await User.find({
    clinicId,
    isActive: true,
    _id: { $ne: currentUserId },
  }).select("_id name avatarUrl role isOnline");

  const staffWithoutConversation = allActiveStaff.filter(
    (staff) => !conversationPartnerIds.has(staff._id.toString()),
  );

  return {
    conversations: conversationsWithUnread,
    staffWithoutConversation,
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

export async function createGroupConversation(
  creatorId: string,
  clinicId: string,
  groupName: string,
  memberIds: string[],
) {
  if (!groupName?.trim()) {
    throw new AppError("Group name is required", 400);
  }
  if (memberIds.length < 2) {
    throw new AppError("A group needs at least 2 other members", 400);
  }

  // confirm sab members isi clinic ke active staff hain
  const validMembers = await User.find({
    _id: { $in: memberIds },
    clinicId,
    isActive: true,
  }).select("_id");

  if (validMembers.length !== memberIds.length) {
    throw new AppError("Some selected members are not available", 400);
  }

  const allMembers = [...new Set([creatorId, ...memberIds])];

  return Conversation.create({
    clinicId,
    type: "group",
    groupName: groupName.trim(),
    members: allMembers,
    admins: [creatorId],
    createdBy: creatorId,
  });
}

//
export async function makeGroupAdmin(
  conversationId: string,
  requesterId: string,
  targetUserId: string,
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.type !== "group") {
    throw new AppError("Group not found", 404);
  }
  if (!conversation?.admins?.some((a) => a.toString() === requesterId)) {
    throw new AppError("Only admins can perform this action", 403);
  }
  if (!conversation?.admins?.some((a) => a.toString() === targetUserId)) {
    conversation.admins.push(targetUserId as any);
    await conversation.save();
  }
  return conversation;
}

export async function removeGroupAdmin(
  conversationId: string,
  requesterId: string,
  targetUserId: string,
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.type !== "group") {
    throw new AppError("Group not found", 404);
  }
  if (!conversation?.admins?.some((a) => a.toString() === requesterId)) {
    throw new AppError("Only admins can perform this action", 403);
  }
  conversation.admins = conversation?.admins?.filter(
    (a) => a.toString() !== targetUserId,
  );
  await conversation.save();
  return conversation;
}

export async function removeGroupMember(
  conversationId: string,
  requesterId: string,
  targetUserId: string,
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.type !== "group") {
    throw new AppError("Group not found", 404);
  }
  if (!conversation?.admins?.some((a) => a.toString() === requesterId)) {
    throw new AppError("Only admins can perform this action", 403);
  }
  if (targetUserId === requesterId) {
    throw new AppError("Use leave group instead", 400);
  }
  conversation.members = conversation.members.filter(
    (m) => m.toString() !== targetUserId,
  );
  conversation.admins = conversation?.admins?.filter(
    (a) => a.toString() !== targetUserId,
  );
  await conversation.save();
  return conversation;
}

export async function toggleMuteConversation(
  conversationId: string,
  userId: string,
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError("Conversation not found", 404);
  if (!conversation.members.some((m) => m.toString() === userId)) {
    throw new AppError("Not a member of this conversation", 403);
  }

  const isMuted = conversation.mutedBy.some((m) => m.toString() === userId);
  if (isMuted) {
    conversation.mutedBy = conversation.mutedBy.filter(
      (m) => m.toString() !== userId,
    );
  } else {
    conversation.mutedBy.push(userId as any);
  }

  await conversation.save();
  return conversation;
}

export async function addGroupMembers(
  conversationId: string,
  requesterId: string,
  newMemberIds: string[],
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.type !== "group") {
    throw new AppError("Group not found", 404);
  }
  if (!conversation?.admins?.some((a) => a.toString() === requesterId)) {
    throw new AppError("Only admins can add members", 403);
  }

  const uniqueNewMembers = newMemberIds.filter(
    (id) => !conversation.members.some((m) => m.toString() === id),
  );

  conversation.members.push(...(uniqueNewMembers as any));
  await conversation.save();
  return conversation;
}

export async function searchPeopleAndConversations(
  userId: string,
  clinicId: string,
  query: string,
) {
  const staff = await User.find({
    clinicId,
    isActive: true,
    _id: { $ne: userId },
    name: { $regex: query, $options: "i" },
  })
    .select("_id name avatarUrl role isOnline")
    .limit(15)
    .lean();

  const staffIds = staff.map((s) => s._id);

  const conversations = await Conversation.find({
    clinicId,
    members: userId, // User must be a member of the conversation
    $or: [
      // Group conversations with groupName matching
      {
        type: "group",
        groupName: { $regex: query, $options: "i" },
      },
      // Direct conversations with staff members who match the query
      {
        type: "direct",
        members: { $in: staffIds }, // Conversation contains at least one matching staff member
      },
    ],
  })
    .populate("members", "name avatarUrl")
    .limit(15)
    .lean();

  return { people: staff, conversations };
}

export async function leaveGroup(conversationId: string, userId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.type !== "group") {
    throw new AppError("Group not found", 404);
  }
  if (!conversation.members.some((m) => m.toString() === userId)) {
    throw new AppError("You are not a member of this group", 403);
  }

  const isLastAdmin =
    conversation?.admins?.length === 1 &&
    conversation?.admins?.[0].toString() === userId;

  conversation.members = conversation.members.filter(
    (m) => m.toString() !== userId,
  );
  conversation.admins = conversation?.admins?.filter(
    (a) => a.toString() !== userId,
  );

  // agar last admin chala gaya aur baaki members bache hain, sabse pehla member ko promote karo
  if (isLastAdmin && conversation.members.length > 0) {
    conversation.admins?.push(conversation.members[0]);
  }

  await conversation.save();
  return conversation;
}

export async function updateGroupSettings(
  conversationId: string,
  userId: string,
  updates: { groupName?: string; groupAvatarUrl?: string },
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation || conversation.type !== "group") {
    throw new AppError("Group not found", 404);
  }
  if (!conversation?.admins?.some((a) => a.toString() === userId)) {
    throw new AppError("Only admins can update group settings", 403);
  }

  if (updates.groupName !== undefined) {
    if (!updates.groupName.trim()) {
      throw new AppError("Group name cannot be empty", 400);
    }
    conversation.groupName = updates.groupName.trim();
  }
  if (updates.groupAvatarUrl !== undefined) {
    conversation.groupAvatarUrl = updates.groupAvatarUrl;
  }

  await conversation.save();
  return conversation;
}
