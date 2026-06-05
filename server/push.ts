/**
 * Web Push helpers — wraps the `web-push` library with VAPID credentials
 * and provides helpers for saving/loading subscriptions from the database.
 */
import webpush from "web-push";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { pushSubscriptions } from "../drizzle/schema";
import { ENV } from "./_core/env";

// Initialise VAPID once at module load.
// Falls back gracefully if keys are missing (e.g. local dev without secrets).
if (ENV.vapidPublicKey && ENV.vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:genie@dannygc.cloud",
    ENV.vapidPublicKey,
    ENV.vapidPrivateKey
  );
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

/** Save a new push subscription to the database. */
export async function savePushSubscription(
  endpoint: string,
  keys: { p256dh: string; auth: string },
  label?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(pushSubscriptions)
    .values({
      endpoint,
      keys: JSON.stringify(keys),
      label: label ?? null,
    })
    .onDuplicateKeyUpdate({ set: { keys: JSON.stringify(keys) } });
}

/** Remove a push subscription by endpoint (called when browser unsubscribes). */
export async function removePushSubscription(endpoint: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

/** Send a push notification to ALL stored subscriptions. */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const subs = await db.select().from(pushSubscriptions);
  const body = JSON.stringify(payload);

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        const keys = JSON.parse(sub.keys) as { p256dh: string; auth: string };
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys },
          body
        );
      } catch (err: unknown) {
        // 410 Gone = subscription expired; clean it up
        if (
          typeof err === "object" &&
          err !== null &&
          "statusCode" in err &&
          (err as { statusCode: number }).statusCode === 410
        ) {
          await removePushSubscription(sub.endpoint);
        } else {
          console.error("[Push] Failed to send to", sub.endpoint, err);
        }
      }
    })
  );
}

/** Send a push notification to a single endpoint. */
export async function sendPushToEndpoint(
  endpoint: string,
  payload: PushPayload
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const rows = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
    .limit(1);

  if (!rows[0]) return;

  const keys = JSON.parse(rows[0].keys) as { p256dh: string; auth: string };
  try {
    await webpush.sendNotification({ endpoint, keys }, JSON.stringify(payload));
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "statusCode" in err &&
      (err as { statusCode: number }).statusCode === 410
    ) {
      await removePushSubscription(endpoint);
    } else {
      throw err;
    }
  }
}
