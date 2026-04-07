import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import type { WacliMcpConfig } from "../config.js";
import { runWacli } from "../wacli.js";
import { toolOk } from "../types.js";

export function registerContactsTools(server: McpServer, config: WacliMcpConfig) {
  server.registerTool(
    "wacli_contacts_search",
    {
      title: "Search Contacts",
      description:
        "Search WhatsApp contacts from synced local metadata. Accepts free-text query matching against names and aliases. Returns contact JID, display name, phone number, and any local aliases or tags. Use to find a contact's JID before other operations.",
      inputSchema: {
        query: z.string().describe("Free-text search query matching contact names and aliases"),
        limit: z.number().optional().describe("Maximum number of results to return"),
      },
    },
    async ({ query, limit }) => {
      return toolOk(await runWacli(config, ["contacts", "search", query], { limit }));
    },
  );

  server.registerTool(
    "wacli_contacts_show",
    {
      title: "Show Contact",
      description:
        "Show detailed information about a single WhatsApp contact by JID. Returns full contact metadata including name, phone number, profile picture status, and any local aliases or tags.",
      inputSchema: {
        jid: z.string().describe("WhatsApp JID of the contact (e.g. 1234567890@s.whatsapp.net)"),
      },
    },
    async ({ jid }) => {
      return toolOk(await runWacli(config, ["contacts", "show"], { jid }));
    },
  );

  server.registerTool(
    "wacli_contacts_refresh",
    {
      title: "Refresh Contacts",
      description:
        "Import/refresh contacts from the WhatsApp session store into the local database. This syncs the latest contact data from WhatsApp. Run after initial auth or when contacts seem out of date.",
      inputSchema: {},
    },
    async () => {
      return toolOk(await runWacli(config, ["contacts", "refresh"]));
    },
  );

  server.registerTool(
    "wacli_contacts_alias_set",
    {
      title: "Set Contact Alias",
      description:
        "Set a local alias for a WhatsApp contact. Aliases are stored locally and don't affect WhatsApp. Useful for giving contacts memorable names beyond their WhatsApp display name.",
      inputSchema: {
        jid: z.string().describe("WhatsApp JID of the contact"),
        alias: z.string().describe("Alias name to assign to the contact"),
      },
    },
    async ({ jid, alias }) => {
      return toolOk(await runWacli(config, ["contacts", "alias", "set"], { jid, alias }));
    },
  );

  server.registerTool(
    "wacli_contacts_alias_rm",
    {
      title: "Remove Contact Alias",
      description:
        "Remove a local alias from a WhatsApp contact.",
      inputSchema: {
        jid: z.string().describe("WhatsApp JID of the contact"),
        alias: z.string().describe("Alias name to remove"),
      },
    },
    async ({ jid, alias }) => {
      return toolOk(await runWacli(config, ["contacts", "alias", "rm"], { jid, alias }));
    },
  );

  server.registerTool(
    "wacli_contacts_tag_add",
    {
      title: "Add Contact Tag",
      description:
        "Add a local tag to a WhatsApp contact for categorization (e.g., 'work', 'family', 'important'). Tags are stored locally only.",
      inputSchema: {
        jid: z.string().describe("WhatsApp JID of the contact"),
        tag: z.string().describe("Tag name to add"),
      },
    },
    async ({ jid, tag }) => {
      return toolOk(await runWacli(config, ["contacts", "tags", "add"], { jid, tag }));
    },
  );

  server.registerTool(
    "wacli_contacts_tag_rm",
    {
      title: "Remove Contact Tag",
      description:
        "Remove a local tag from a WhatsApp contact.",
      inputSchema: {
        jid: z.string().describe("WhatsApp JID of the contact"),
        tag: z.string().describe("Tag name to remove"),
      },
    },
    async ({ jid, tag }) => {
      return toolOk(await runWacli(config, ["contacts", "tags", "rm"], { jid, tag }));
    },
  );
}
