import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import type { WacliMcpConfig } from "../config.js";
import { runWacli } from "../wacli.js";
import { toolOk } from "../types.js";

export function registerMessagesTools(server: McpServer, config: WacliMcpConfig) {
  server.registerTool(
    "wacli_messages_list",
    {
      title: "List Messages",
      description:
        "List messages from a specific chat. Requires chat JID. Optional time range filtering (RFC3339 or YYYY-MM-DD) and result limit (default 50). Use wacli_chats_list first to find a chat's JID.",
      inputSchema: {
        chat: z.string().describe("Chat JID (use wacli_chats_list to find it)"),
        after: z.string().optional().describe("Show messages after this time (RFC3339 or YYYY-MM-DD)"),
        before: z.string().optional().describe("Show messages before this time (RFC3339 or YYYY-MM-DD)"),
        limit: z.number().optional().describe("Maximum number of messages to return (default 50)"),
      },
    },
    async ({ chat, after, before, limit }) => {
      const flags: Record<string, unknown> = { chat };
      if (after) flags.after = after;
      if (before) flags.before = before;
      if (limit) flags.limit = limit;
      return toolOk(await runWacli(config, ["messages", "list"], flags));
    },
  );

  server.registerTool(
    "wacli_messages_search",
    {
      title: "Search Messages",
      description:
        "Search WhatsApp messages using full-text search (FTS5). Accepts free-text query, optional chat scoping, sender filtering, time range, and media type filter. Use for finding messages by content. Limit results with maxResults (default 50).",
      inputSchema: {
        query: z.string().describe("Free-text search query"),
        chat: z.string().optional().describe("Limit search to a specific chat JID"),
        from: z.string().optional().describe("Filter by sender JID"),
        after: z.string().optional().describe("Search messages after this time (RFC3339 or YYYY-MM-DD)"),
        before: z.string().optional().describe("Search messages before this time (RFC3339 or YYYY-MM-DD)"),
        maxResults: z.number().optional().describe("Maximum number of results (default 50)"),
        type: z.enum(["image", "video", "audio", "document"]).optional().describe("Filter by media type"),
      },
    },
    async ({ query, chat, from, after, before, maxResults, type }) => {
      const flags: Record<string, unknown> = {};
      if (chat) flags.chat = chat;
      if (from) flags.from = from;
      if (after) flags.after = after;
      if (before) flags.before = before;
      if (maxResults) flags.limit = maxResults;
      if (type) flags.type = type;
      return toolOk(await runWacli(config, ["messages", "search", query], flags));
    },
  );

  server.registerTool(
    "wacli_messages_show",
    {
      title: "Show Message",
      description:
        "Show a single WhatsApp message by chat JID and message ID. Returns full message metadata including sender, timestamp, content, and media info.",
      inputSchema: {
        chat: z.string().describe("Chat JID containing the message"),
        id: z.string().describe("Message ID"),
      },
    },
    async ({ chat, id }) => {
      return toolOk(await runWacli(config, ["messages", "show"], { chat, id }));
    },
  );

  server.registerTool(
    "wacli_messages_context",
    {
      title: "Message Context",
      description:
        "Show the message context (surrounding messages) around a specific message ID. Useful for understanding conversation flow. Returns messages before and after the target message.",
      inputSchema: {
        chat: z.string().describe("Chat JID containing the message"),
        id: z.string().describe("Message ID to show context around"),
        before: z.number().optional().describe("Number of messages before the target (default 5)"),
        after: z.number().optional().describe("Number of messages after the target (default 5)"),
      },
    },
    async ({ chat, id, before, after }) => {
      const flags: Record<string, unknown> = { chat, id };
      if (before !== undefined) flags.before = before;
      if (after !== undefined) flags.after = after;
      return toolOk(await runWacli(config, ["messages", "context"], flags));
    },
  );
}
