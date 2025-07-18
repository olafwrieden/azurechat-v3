import { agentClient } from "@/lib/ai-foundry";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { isBookmarked } from "../utils";

export const threadRouter = createTRPCRouter({
  create: baseProcedure
    .input(
      z.object({
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Destructure the input
      const { userId } = input;

      // Create a new Azure AI Foundry Agent thread
      const thread = await agentClient.threads.create()
      console.debug("Created thread, thread ID:", thread.id);

      return thread;
    }),

  getMany: baseProcedure
    .input(
      z.object({
        // TODO: Pagination and filtering
      }),
    )
    .query(async ({ ctx, input }) => {
      // Retrieve threads from Azure AI Foundry
      const threadsIterator = agentClient.threads.list();
      const threads = [];
      for await (const thread of threadsIterator) {
        console.debug("Thread ID:", thread.id);
        threads.push(thread);
      }

      return threads;
    }),

  getById: baseProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { id } = input;

      // Retrieve the thread from Azure AI Foundry
      const thread = await agentClient.threads.get(id);
      console.debug("Retrieved thread:", thread);

      return thread;
    }),

  bookmark: baseProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    ).mutation(async ({ ctx, input }) => {
      const { id } = input;

      const thread = await agentClient.threads.get(id);

      if (isBookmarked(thread)) {
        // Remove the bookmark metadata
        const { isBookmarked, ...restMetadata } = thread.metadata ?? {};
        const updated = await agentClient.threads.update(id, {
          metadata: {
            ...restMetadata,
            // TODO: Find out why simply removing the metadata entry does not work
            isBookmarked: "false",
          },
        });

        return updated;
      }

      // Set isBookmarked metadata to "true"
      const bookmarked = await agentClient.threads.update(id, {
        metadata: {
          ...thread.metadata,
          isBookmarked: "true",
        },
      });

      return bookmarked;
    }),
  delete: baseProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // Delete the thread from Azure AI Foundry
      const status = await agentClient.threads.delete(id);
      console.debug("Deleted thread:", id);

      return { success: status.deleted };
    })
});