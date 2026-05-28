import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  contactUs: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "name is required"),
        email: z.string().email("invalid email"),
        message: z.string().min(1, "message is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner({
        title: `New Contact Form Submission from ${input.name}`,
        content: `Email: ${input.email}\n\nMessage:\n${input.message}`,
      });
      return {
        success: delivered,
      } as const;
    }),
});
