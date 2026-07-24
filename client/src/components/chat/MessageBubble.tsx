// // src/components/chat/MessageBubble.tsx
// import { useState } from "react";
// import { Check, CheckCheck, FileText, Download, Forward } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Textarea } from "@/components/ui/textarea";
// import { getInitials } from "@/lib/formatDate";
// import { parseMessageText } from "@/utils/linkify";
// import { cn } from "@/lib/utils";
// import AudioMessagePlayer from "./AudioMessagePlayer";
// import ReactionPicker from "./ReactionPicker";
// import MessageContextMenu from "./MessageContextMenu";
// import type { Attachment } from "@/types/message.types";
// import { toast } from "sonner";
// import { deleteMessage, editMessage, reactToMessage } from "@/api/message.api";
// import { useQueryClient } from "@tanstack/react-query";
// import axiosClient from "@/api/axiosClient";

// interface MessageBubbleProps {
//   text?: string;
//   attachments?: Attachment[];
//   createdAt: string;
//   status: "sent" | "delivered" | "read";
//   isOwn: boolean;
//   showAvatar?: boolean;
//   senderName?: string;
//   senderAvatarUrl?: string;
//   messageId: string;
//   reactions?: { userId: string; emoji: string }[];
//   isEdited?: boolean;
//   isDeleted?: boolean;
//   forwardedFrom?: string;
//   replyToText?: string;
//   replyToSenderName?: string;
//   currentUserId: string;
//   conversationId: string; // naya - pin API call ke liye zaroori
//   isPinned?: boolean; // naya
//   canPin?: boolean; // naya - parent se aayega (group-admin check ya direct-chat)
//   onReply?: () => void;
//   onForward?: () => void;
// }

// function formatFileSize(bytes: number) {
//   if (bytes < 1024) return `${bytes} B`;
//   if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
//   return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
// }

// function formatMessageTime(dateStr: string) {
//   return new Date(dateStr).toLocaleTimeString([], {
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// const MessageBubble = ({
//   text,
//   attachments = [],
//   createdAt,
//   status,
//   isOwn,
//   showAvatar,
//   senderName,
//   senderAvatarUrl,
//   messageId,
//   reactions,
//   isEdited,
//   isDeleted,
//   forwardedFrom,
//   replyToText,
//   replyToSenderName,
//   currentUserId,
//   conversationId,
//   isPinned,
//   canPin,
//   onReply,
//   onForward,
// }: MessageBubbleProps) => {
//   const queryClient = useQueryClient();

//   const [isEditing, setIsEditing] = useState(false);
//   const [editText, setEditText] = useState(text || "");
//   const EDIT_WINDOW_MS = 15 * 60 * 1000;
//   const canEdit = Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;

//   const handleReact = async (emoji: string) => {
//     try {
//       await reactToMessage(messageId, emoji);
//     } catch {
//       toast.error("Failed to add reaction");
//     }
//   };

//   const handleEditSubmit = async () => {
//     if (!editText.trim()) return;
//     try {
//       await editMessage(messageId, editText.trim());
//       setIsEditing(false);
//     } catch (err: any) {
//       toast.error(err?.response?.data?.message || "Failed to edit message");
//     }
//   };

//   const handleDelete = async (forEveryone: boolean) => {
//     try {
//       await deleteMessage(messageId, forEveryone);
//     } catch {
//       toast.error("Failed to delete message");
//     }
//   };

//   const handleCopy = () => {
//     if (text) {
//       navigator.clipboard.writeText(text);
//       toast.success("Copied to clipboard");
//     }
//   };

//   const groupedReactions = reactions?.reduce(
//     (acc, r) => {
//       acc[r.emoji] = (acc[r.emoji] || 0) + 1;
//       return acc;
//     },
//     {} as Record<string, number>,
//   );

//   const handleTogglePin = async () => {
//     try {
//       await axiosClient.post(`/messages/${messageId}/pin`);
//       queryClient.invalidateQueries({
//         queryKey: ["pinned-messages", conversationId],
//       });
//     } catch {
//       toast.error("Failed to update pin status");
//     }
//   };

//   return (
//     <div
//       className={cn(
//         "group/message flex items-end gap-2",
//         isOwn ? "justify-end" : "justify-start",
//       )}
//     >
//       {/* Hover actions - reaction picker + context menu */}
//       {!isEditing && (
//         <div
//           className={cn(
//             "flex items-center gap-0.5 opacity-0 transition-opacity group-hover/message:opacity-100",
//             isOwn ? "order-first" : "order-last",
//           )}
//         >
//           <ReactionPicker onSelect={handleReact} />
//           {!isDeleted && (
//             <MessageContextMenu
//               isOwn={isOwn}
//               canEdit={canEdit}
//               isPinned={isPinned}
//               canPin={canPin}
//               onReply={() => onReply?.()}
//               onForward={() => onForward?.()}
//               onEdit={() => setIsEditing(true)}
//               onDelete={() => handleDelete(false)}
//               onCopy={handleCopy}
//               onTogglePin={handleTogglePin}
//             />
//           )}
//         </div>
//       )}

//       {!isOwn && showAvatar && (
//         <Avatar className="h-7 w-7 shrink-0">
//           <AvatarImage src={senderAvatarUrl} alt={senderName} />
//           <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
//             {senderName ? getInitials(senderName) : "?"}
//           </AvatarFallback>
//         </Avatar>
//       )}
//       {/* {!isOwn && !showAvatar && <div className="w-7 shrink-0" />} */}

//       <div
//         className={cn(
//           "max-w-[70%] rounded-2xl text-sm leading-relaxed shadow-sm",
//           attachments.length > 0 && !isDeleted && !isEditing
//             ? "overflow-hidden p-1.5"
//             : "px-3.5 py-2",
//           isOwn
//             ? "rounded-br-md bg-primary text-primary-foreground"
//             : "rounded-bl-md bg-muted text-foreground",
//         )}
//       >
//         {!isOwn && showAvatar && senderName && !isDeleted && (
//           <p
//             className={cn(
//               "mb-0.5 text-xs font-semibold text-primary",
//               attachments.length > 0 && !isEditing && "px-2 pt-1",
//             )}
//           >
//             {senderName}
//           </p>
//         )}

//         {isDeleted ? (
//           <p className="italic text-muted-foreground/70">
//             {isOwn ? "You deleted this message" : "This message was deleted"}
//           </p>
//         ) : isEditing ? (
//           <div className="flex flex-col gap-1.5">
//             <Textarea
//               value={editText}
//               onChange={(e) => setEditText(e.target.value)}
//               className="min-h-[60px] resize-none bg-background/50 text-sm"
//               autoFocus
//             />
//             <div className="flex justify-end gap-1.5">
//               <button
//                 onClick={() => setIsEditing(false)}
//                 className="text-xs text-muted-foreground hover:underline"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleEditSubmit}
//                 className="text-xs font-medium text-primary hover:underline"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         ) : (
//           <>
//             {forwardedFrom && (
//               <p className="mb-1 flex items-center gap-1 text-xs italic opacity-70">
//                 <Forward className="h-3 w-3" /> Forwarded
//               </p>
//             )}

//             {replyToText && (
//               <div
//                 className={cn(
//                   "mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs opacity-80",
//                   isOwn
//                     ? "border-primary-foreground/40 bg-black/10"
//                     : "border-primary bg-background/40",
//                   attachments.length > 0 && "mx-2 mt-1",
//                 )}
//               >
//                 <p className="font-medium">{replyToSenderName}</p>
//                 <p className="truncate">{replyToText}</p>
//               </div>
//             )}

//             {/* Attachments */}
//             {attachments.map((att, i) => (
//               <div key={i} className="mx-2 my-1.5 last:mb-0">
//                 {att.type === "image" ? (
//                   <a href={att.url} target="_blank" rel="noopener noreferrer">
//                     <img
//                       src={att.url}
//                       alt={att.fileName}
//                       className="max-h-64 w-full rounded-lg object-cover"
//                     />
//                   </a>
//                 ) : att.type === "video" ? (
//                   <video
//                     src={att.url}
//                     controls
//                     className="max-h-64 w-full rounded-lg"
//                   />
//                 ) : att.type === "audio" ? (
//                   <AudioMessagePlayer url={att.url} isOwn={isOwn} />
//                 ) : (
//                   <a
//                     href={att.url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className={cn(
//                       "flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors",
//                       isOwn
//                         ? "border-primary-foreground/20 hover:bg-primary-foreground/10"
//                         : "border-border/60 hover:bg-background/60",
//                     )}
//                   >
//                     <div
//                       className={cn(
//                         "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
//                         isOwn ? "bg-primary-foreground/15" : "bg-primary/10",
//                       )}
//                     >
//                       <FileText className="h-4 w-4" />
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <p className="truncate text-xs font-medium">
//                         {att.fileName}
//                       </p>
//                       <p
//                         className={cn(
//                           "text-[10px]",
//                           isOwn
//                             ? "text-primary-foreground/70"
//                             : "text-muted-foreground",
//                         )}
//                       >
//                         {formatFileSize(att.fileSize)}
//                       </p>
//                     </div>
//                     <Download className="h-3.5 w-3.5 shrink-0 opacity-60" />
//                   </a>
//                 )}
//               </div>
//             ))}

//             {/* Text */}
//             {text && (
//               <p
//                 className={cn(
//                   "whitespace-pre-wrap break-words",
//                   attachments.length > 0 && "px-2 pb-1 pt-0.5",
//                 )}
//               >
//                 {parseMessageText(text).map((part, i) => {
//                   if (part.type === "link") {
//                     return (
//                       <a
//                         key={i}
//                         href={part.value}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         onClick={(e) => e.stopPropagation()}
//                         className={cn(
//                           "underline underline-offset-2 hover:opacity-80",
//                           isOwn ? "text-primary-foreground" : "text-primary",
//                         )}
//                       >
//                         {part.value}
//                       </a>
//                     );
//                   }

//                   if (part.type === "mention") {
//                     return (
//                       <span
//                         key={i}
//                         className={cn(
//                           "rounded px-1 font-semibold",
//                           isOwn
//                             ? "bg-primary-foreground/15 text-primary-foreground"
//                             : "bg-primary/10 text-primary",
//                         )}
//                       >
//                         {part.value}
//                       </span>
//                     );
//                   }

//                   return <span key={i}>{part.value}</span>;
//                 })}
//               </p>
//             )}
//           </>
//         )}

//         {/* Reactions display - current user ka reaction highlight hota hai */}
//         {!isEditing &&
//           groupedReactions &&
//           Object.keys(groupedReactions).length > 0 && (
//             <div className="mt-1 flex flex-wrap gap-1">
//               {Object.entries(groupedReactions).map(([emoji, count]) => {
//                 const hasReactedByMe = reactions?.some(
//                   (r) => r.emoji === emoji && r.userId === currentUserId,
//                 );
//                 return (
//                   <button
//                     key={emoji}
//                     onClick={() => handleReact(emoji)}
//                     className={cn(
//                       "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs shadow-sm transition-colors",
//                       hasReactedByMe
//                         ? "bg-primary/20 ring-1 ring-primary/40"
//                         : "bg-background/80 hover:bg-background",
//                     )}
//                   >
//                     {emoji}
//                     {count > 1 && (
//                       <span className="text-[10px] text-muted-foreground">
//                         {count}
//                       </span>
//                     )}
//                   </button>
//                 );
//               })}
//             </div>
//           )}

//         {/* Timestamp/status */}
//         {!isEditing && (
//           <div
//             className={cn(
//               "flex items-center justify-end gap-1 text-[10px]",
//               attachments.length > 0 && !isDeleted ? "px-2 pb-1" : "mt-1",
//               isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
//             )}
//           >
//             {isEdited && !isDeleted && (
//               <span className="italic opacity-70">edited</span>
//             )}
//             <span>{formatMessageTime(createdAt)}</span>
//             {isOwn && !isDeleted && (
//               <>
//                 {status === "read" ? (
//                   <CheckCheck className="h-3 w-3 text-sky-300" />
//                 ) : status === "delivered" ? (
//                   <CheckCheck className="h-3 w-3" />
//                 ) : (
//                   <Check className="h-3 w-3" />
//                 )}
//               </>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MessageBubble;

// src/components/chat/MessageBubble.tsx
import { useState } from "react";
import {
  Check,
  CheckCheck,
  FileText,
  Download,
  Forward,
  Play,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import { getInitials } from "@/lib/formatDate";
import { parseMessageText } from "@/utils/linkify";
import { cn } from "@/lib/utils";
import AudioMessagePlayer from "./AudioMessagePlayer";
import ReactionPicker from "./ReactionPicker";
import MessageContextMenu from "./MessageContextMenu";
import type { Attachment } from "@/types/message.types";
import { toast } from "sonner";
import { deleteMessage, editMessage, reactToMessage } from "@/api/message.api";
import { useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/api/axiosClient";
import { useUIStore } from "@/store/uiStore";

interface MessageBubbleProps {
  text?: string;
  attachments?: Attachment[];
  createdAt: string;
  status: "sent" | "delivered" | "read";
  isOwn: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderAvatarUrl?: string;
  messageId: string;
  reactions?: { userId: string; emoji: string }[];
  isEdited?: boolean;
  isDeleted?: boolean;
  forwardedFrom?: string;
  replyToText?: string;
  replyToSenderName?: string;
  currentUserId: string;
  conversationId: string;
  isPinned?: boolean;
  canPin?: boolean;
  onReply?: () => void;
  onForward?: () => void;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MAX_VISIBLE_REACTIONS = 3;

const MessageBubble = ({
  text,
  attachments = [],
  createdAt,
  status,
  isOwn,
  showAvatar,
  senderName,
  senderAvatarUrl,
  messageId,
  reactions,
  isEdited,
  isDeleted,
  forwardedFrom,
  replyToText,
  replyToSenderName,
  currentUserId,
  conversationId,
  isPinned,
  canPin,
  onReply,
  onForward,
}: MessageBubbleProps) => {
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text || "");
  const EDIT_WINDOW_MS = 15 * 60 * 1000;
  const canEdit = Date.now() - new Date(createdAt).getTime() < EDIT_WINDOW_MS;

  const openViewer = useUIStore((s) => s.openViewer);

  const handleReact = async (emoji: string) => {
    try {
      await reactToMessage(messageId, emoji);
    } catch {
      toast.error("Failed to add reaction");
    }
  };

  const handleEditSubmit = async () => {
    if (!editText.trim()) return;
    try {
      await editMessage(messageId, editText.trim());
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to edit message");
    }
  };

  const handleDelete = async (forEveryone: boolean) => {
    try {
      await deleteMessage(messageId, forEveryone);
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const handleCopy = () => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    }
  };

  const handleTogglePin = async () => {
    try {
      await axiosClient.post(`/messages/${messageId}/pin`);
      queryClient.invalidateQueries({
        queryKey: ["pinned-messages", conversationId],
      });
    } catch {
      toast.error("Failed to update pin status");
    }
  };

  // grouped reactions: emoji -> {count, reactedByMe}
  const groupedReactions = reactions?.reduce(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, reactedByMe: false };
      acc[r.emoji].count += 1;
      if (r.userId === currentUserId) acc[r.emoji].reactedByMe = true;
      return acc;
    },
    {} as Record<string, { count: number; reactedByMe: boolean }>,
  );

  const reactionEntries = groupedReactions
    ? Object.entries(groupedReactions)
    : [];
  const visibleReactions = reactionEntries.slice(0, MAX_VISIBLE_REACTIONS);
  const extraReactionsCount = reactionEntries.length - MAX_VISIBLE_REACTIONS;

  const bubbleVariant = isOwn ? "default" : "secondary";

  return (
    <div
      className={cn(
        "group/message flex items-end gap-2",
        isOwn ? "justify-end" : "justify-start",
      )}
    >
      {/* Hover actions */}
      {!isEditing && (
        <div
          className={cn(
            "flex items-center gap-0.5 self-center opacity-0 transition-opacity group-hover/message:opacity-100",
            isOwn ? "order-first" : "order-last",
          )}
        >
          <ReactionPicker onSelect={handleReact} />
          {!isDeleted && (
            <MessageContextMenu
              isOwn={isOwn}
              canEdit={canEdit}
              isPinned={isPinned}
              canPin={canPin}
              onReply={() => onReply?.()}
              onForward={() => onForward?.()}
              onEdit={() => setIsEditing(true)}
              onDelete={() => handleDelete(false)}
              onCopy={handleCopy}
              onTogglePin={handleTogglePin}
            />
          )}
        </div>
      )}

      {!isOwn && showAvatar && (
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarImage src={senderAvatarUrl} alt={senderName} />
          <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
            {senderName ? getInitials(senderName) : "?"}
          </AvatarFallback>
        </Avatar>
      )}
      {/* {!isOwn && !showAvatar && <div className="w-7 shrink-0" />} */}

      {/* Extra bottom margin jab reactions ho, taaki overlap ke liye jagah bache */}
      <Bubble
        variant={bubbleVariant}
        align={isOwn ? "end" : "start"}
        className={cn(
          "rounded-t-lg",
          reactionEntries.length > 0 && "mb-3",
          isOwn ? "rounded-bl-lg" : "rounded-br-lg",
        )}
      >
        <BubbleContent
          className={cn(
            attachments.length > 0 && !isDeleted && !isEditing
              ? "overflow-hidden p-1.5"
              : undefined,
            isOwn ? "rounded-br-md" : "rounded-bl-md",
          )}
        >
          {!isOwn && showAvatar && senderName && !isDeleted && (
            <p
              className={cn(
                "mb-0.5 text-xs font-semibold text-primary",
                attachments.length > 0 && !isEditing && "px-2 pt-1",
              )}
            >
              {senderName}
            </p>
          )}

          {isDeleted ? (
            <p className="italic text-muted-foreground/70">
              {isOwn ? "You deleted this message" : "This message was deleted"}
            </p>
          ) : isEditing ? (
            <div className="flex flex-col gap-1.5">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] resize-none bg-background/50 text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {forwardedFrom && (
                <p className="mb-1 flex items-center gap-1 text-xs italic opacity-70">
                  <Forward className="h-3 w-3" /> Forwarded
                </p>
              )}

              {replyToText && (
                <div
                  className={cn(
                    "mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs opacity-80",
                    isOwn
                      ? "border-primary-foreground/40 bg-black/10"
                      : "border-primary bg-background/40",
                    attachments.length > 0 && "mx-2 mt-1",
                  )}
                >
                  <p className="font-medium">{replyToSenderName}</p>
                  <p className="truncate">{replyToText}</p>
                </div>
              )}

              {attachments.map((att, i) => {
                const senderInfo = {
                  name: isOwn ? "You" : senderName,
                  avatarUrl: senderAvatarUrl,
                  date: createdAt,
                };

                return (
                  <div key={i} className="mx-2 my-1.5 last:mb-0">
                    {att.type === "image" ? (
                      <button
                        onClick={() =>
                          openViewer(
                            att,
                            attachments.filter(
                              (a) => a.type === "image" || a.type === "video",
                            ),
                            senderInfo,
                            messageId,
                          )
                        }
                        className="block w-full"
                      >
                        <img
                          src={att.url}
                          alt={att.fileName}
                          className="max-h-64 w-full rounded-lg object-cover"
                        />
                      </button>
                    ) : att.type === "video" ? (
                      <button
                        onClick={() =>
                          openViewer(
                            att,
                            attachments.filter(
                              (a) => a.type === "image" || a.type === "video",
                            ),
                            senderInfo,
                            messageId,
                          )
                        }
                        className="relative block w-full"
                      >
                        <video
                          src={att.url}
                          className="max-h-64 w-full rounded-lg object-cover"
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50">
                            <Play className="h-5 w-5 fill-white text-white" />
                          </div>
                        </div>
                      </button>
                    ) : att.type === "audio" ? (
                      <AudioMessagePlayer url={att.url} isOwn={isOwn} />
                    ) : (
                      // <a
                      //   href={att.url}
                      //   target="_blank"
                      //   rel="noopener noreferrer"
                      //   className={cn(
                      //     "flex items-center gap-2.5 rounded-lg border p-2.5 transition-colors",
                      //     isOwn
                      //       ? "border-primary-foreground/20 hover:bg-primary-foreground/10"
                      //       : "border-border/60 hover:bg-background/60",
                      //   )}
                      // >
                      <button
                        onClick={() =>
                          openViewer(att, [], senderInfo, messageId)
                        }
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                          isOwn
                            ? "border-primary-foreground/20 hover:bg-primary-foreground/10"
                            : "border-border/60 hover:bg-background/60",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            isOwn
                              ? "bg-primary-foreground/15"
                              : "bg-primary/10",
                          )}
                        >
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {att.fileName}
                          </p>
                          <p
                            className={cn(
                              "text-[10px]",
                              isOwn
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {formatFileSize(att.fileSize)}
                          </p>
                        </div>
                        <Download className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      </button>

                      // </a>
                    )}
                  </div>
                );
              })}

              {text && (
                <p
                  className={cn(
                    "whitespace-pre-wrap break-words",
                    attachments.length > 0 && "px-2 pb-1 pt-0.5",
                  )}
                >
                  {parseMessageText(text).map((part, i) => {
                    if (part.type === "link") {
                      return (
                        <a
                          key={i}
                          href={part.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            "underline underline-offset-2 hover:opacity-80",
                            isOwn ? "text-primary-foreground" : "text-primary",
                          )}
                        >
                          {part.value}
                        </a>
                      );
                    }
                    if (part.type === "mention") {
                      return (
                        <span
                          key={i}
                          className={cn(
                            "rounded px-1 font-semibold",
                            isOwn
                              ? "bg-primary-foreground/15 text-primary-foreground"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          {part.value}
                        </span>
                      );
                    }
                    return <span key={i}>{part.value}</span>;
                  })}
                </p>
              )}
            </>
          )}

          {!isEditing && (
            <div
              className={cn(
                "flex items-center justify-end gap-1 text-[10px]",
                attachments.length > 0 && !isDeleted ? "px-2 pb-1" : "mt-1",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              {isEdited && !isDeleted && (
                <span className="italic opacity-70">edited</span>
              )}
              <span>{formatMessageTime(createdAt)}</span>
              {isOwn && !isDeleted && (
                <>
                  {status === "read" ? (
                    <CheckCheck className="h-3 w-3 text-sky-300" />
                  ) : status === "delivered" ? (
                    <CheckCheck className="h-3 w-3" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                </>
              )}
            </div>
          )}
        </BubbleContent>

        {/* Reactions - bubble ke bottom edge se overlap, WhatsApp jaisa */}
        {!isEditing && reactionEntries.length > 0 && (
          <BubbleReactions
            side="bottom"
            align={isOwn ? "end" : "end"}
            role="img"
            aria-label={`Reactions: ${reactionEntries.map(([e]) => e).join(", ")}`}
          >
            {visibleReactions.map(([emoji, data]) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className={cn(
                  "flex items-center justify-center rounded-full px-0.5 text-sm transition-transform hover:scale-110",
                  data.reactedByMe && "",
                )}
              >
                {emoji}
              </button>
            ))}
            {extraReactionsCount > 0 && (
              <span className="pl-0.5 text-[10px] font-medium text-muted-foreground">
                +{extraReactionsCount}
              </span>
            )}
          </BubbleReactions>
        )}
      </Bubble>
    </div>
  );
};

export default MessageBubble;
