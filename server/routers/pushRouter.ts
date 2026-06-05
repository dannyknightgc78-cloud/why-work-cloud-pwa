/**
 * Push notification tRPC router.
 * Provides:
 *  - push.subscribe    — save a browser PushSubscription to the DB
 *  - push.unsubscribe  — remove a subscription by endpoint
 *  - push.sendAll      — (owner-only) broadcast a test push to all subscribers
 *  - push.vapidKey     — return the public VAPID key so the frontend can subscribe
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { ENV } from "../_core/env";
import { savePushSubscription, removePushSubscription, sendPushToAll } from "../push";
import { TRPCError } from "@trpc/server";

export const pushRouter = router({
  /** Return the VAPID public key — needed by the frontend to create a subscription. */
  vapidKey: publicProcedure.query(() => ({
    publicKey: ENV.vapidPublicKey,
  })),

  /** Save a PushSubscription from the browser to the database. */
  subscribe: publicProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
        label: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await savePushSubscription(input.endpoint, input.keys, input.label);
      return { success: true };
    }),

  /** Remove a PushSubscription (called when user disables notifications). */
  unsubscribe: publicProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ input }) => {
      await removePushSubscription(input.endpoint);
      return { success: true };
    }),

  /** Broadcast a test notification to all subscribers (owner only). */
  sendAll: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        body: z.string(),
        url: z.string().optional(),
        tag: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
      }
      await sendPushToAll({
        title: input.title,
        body: input.body,
        url: input.url,
        tag: input.tag,
      });
      return { success: true };
    }),
});
