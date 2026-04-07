import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import type { WacliMcpConfig } from "../config.js";
import { runWacli } from "../wacli.js";
import { toolOk } from "../types.js";

export function registerChatsTools(server: McpServer, config: WacliMcpConfig) {
  server.registerTool(
    "wacli_chats_list",
    {
      title: "List Chats",
      description:
        "List WhatsApp chats from the local DB. Accepts optional search query to filter chats by name/JID, and limit (default 50). Returns chat metadata including JID, name, last message timestamp, unread count.",
      inputSchema: {
        query: z.string().optional().describe("Search query to filter chats by name or JID"),
        limit: z.number().optional().describe("Maximum number of chats to return (default 50)"),
      },
    },
    async ({ query, limit }) => {
      const flags: Record<string, unknown> = {};
      if (query) flags.query = query;
      if (limit) flags.limit = limit;
      return toolOk(await runWacli(config, ["chats", "list"], flags));
    },
  );

  server.registerTool(
    "wacli_chats_show",
    {
      title: "Show Chat",
      description:
        "Show details of a single WhatsApp chat by JID. Returns full chat metadata including participant info, settings, and last activity. JID format is `phone@s.whatsapp.net` for DMs or `group-id@g.us` for groups.",
      inputSchema: {
        jid: z.string().describe("Chat JID (e.g., 1234567890@s.whatsapp.net or group-id@g.us)"),
      },
    },
    async ({ jid }) => {
      return toolOk(await runWacli(config, ["chats", "show"], { jid }));
    },
  );
}
