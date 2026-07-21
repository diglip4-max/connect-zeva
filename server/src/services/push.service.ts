import webpush from "web-push";
import { ENV } from "../config/env";
import { PushSubscription } from "../models/PushSubscription.model";
import logger from "../utils/logger";

webpush.setVapidDetails(
  ENV.VAPID_SUBJECT,
  ENV.VAPID_PUBLIC_KEY,
  ENV.VAPID_PRIVATE_KEY,
);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  conversationId: string;
  senderName: string;
}

export async function sendPushToUser(
  userId: string,
  payload: NotificationPayload,
) {
  const subscriptions = await PushSubscription.find({ userId });

  if (subscriptions.length === 0) return;

  const pushPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    data: {
      conversationId: payload.conversationId,
      url: `/chat?conversationId=${payload.conversationId}`,
    },
  });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        const res = await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          pushPayload,
        );
        console.log(res);

        // naya - successful send ke baad lastUsedAt update karo
        sub.lastUsedAt = new Date();
        await sub.save();
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // subscription expire/invalid ho chuki hai - clean up karo
          await PushSubscription.deleteOne({ _id: sub._id });
          logger.info(
            { userId, endpoint: sub.endpoint },
            "Removed stale push subscription",
          );
        } else {
          logger.warn({ err, userId }, "Failed to send push notification");
        }
      }
    }),
  );
}

export async function sendPushToUsers(
  userIds: string[],
  payload: NotificationPayload,
) {
  console.log({ userIds, payload });
  await Promise.all(userIds.map((userId) => sendPushToUser(userId, payload)));
}
