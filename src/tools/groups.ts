import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import type { WacliMcpConfig } from "../config.js";
import { runWacli } from "../wacli.js";
import { toolOk } from "../types.js";

export function registerGroupsTools(server: McpServer, config: WacliMcpConfig) {
  // ─── Group listing & info ───────────────────────────────────────────────

  server.registerTool(
    "wacli_groups_list",
    {
      title: "List Groups",
      description:
        "List known WhatsApp groups from the local DB. Requires prior sync (run wacli sync or use wacli_groups_refresh to populate). Optional search query to filter by group name.",
      inputSchema: {
        query: z.string().optional().describe("Optional search query to filter groups by name"),
        limit: z.number().optional().describe("Maximum number of groups to return"),
      },
    },
    async ({ query, limit }) => {
      return toolOk(await runWacli(config, ["groups", "list"], { query, limit }));
    },
  );

  server.registerTool(
    "wacli_groups_info",
    {
      title: "Group Info",
      description:
        "Fetch live group info and update local DB. Returns group name, description, creation date, settings, and participant count. jid format: group-id@g.us",
      inputSchema: {
        jid: z.string().describe("Group JID (e.g. 123456789-0123456789@g.us)"),
      },
    },
    async ({ jid }) => {
      return toolOk(await runWacli(config, ["groups", "info"], { jid }));
    },
  );

  server.registerTool(
    "wacli_groups_refresh",
    {
      title: "Refresh Groups",
      description:
        "Fetch all joined groups (live) and update local database. Run this first to populate the group list before using other group tools.",
      inputSchema: {},
    },
    async () => {
      return toolOk(await runWacli(config, ["groups", "refresh"]));
    },
  );

  // ─── Group management ───────────────────────────────────────────────────

  server.registerTool(
    "wacli_groups_rename",
    {
      title: "Rename Group",
      description:
        "Rename a WhatsApp group. Requires admin privileges. This change is visible to all group members.",
      inputSchema: {
        jid: z.string().describe("Group JID (e.g. 123456789-0123456789@g.us)"),
        name: z.string().describe("New group name"),
      },
    },
    async ({ jid, name }) => {
      return toolOk(await runWacli(config, ["groups", "rename"], { jid, name }));
    },
  );

  server.registerTool(
    "wacli_groups_leave",
    {
      title: "Leave Group",
      description:
        "Leave a WhatsApp group. This action is irreversible. You will lose access to all group messages and history.",
      inputSchema: {
        jid: z.string().describe("Group JID to leave (e.g. 123456789-0123456789@g.us)"),
      },
    },
    async ({ jid }) => {
      return toolOk(await runWacli(config, ["groups", "leave"], { jid }));
    },
  );

  server.registerTool(
    "wacli_groups_join",
    {
      title: "Join Group",
      description:
        "Join a WhatsApp group using an invite code (the code portion of an invite link, e.g., 'ABC123' from https://chat.whatsapp.com/ABC123).",
      inputSchema: {
        code: z.string().describe("Invite code from a WhatsApp group link"),
      },
    },
    async ({ code }) => {
      return toolOk(await runWacli(config, ["groups", "join"], { code }));
    },
  );

  // ─── Invite link operations ─────────────────────────────────────────────

  server.registerTool(
    "wacli_groups_invite_link_get",
    {
      title: "Get Group Invite Link",
      description:
        "Get the current invite link for a WhatsApp group. Requires admin privileges. Returns the full invite link URL.",
      inputSchema: {
        jid: z.string().describe("Group JID (e.g. 123456789-0123456789@g.us)"),
      },
    },
    async ({ jid }) => {
      return toolOk(await runWacli(config, ["groups", "invite", "link", "get"], { jid }));
    },
  );

  server.registerTool(
    "wacli_groups_invite_link_revoke",
    {
      title: "Revoke Group Invite Link",
      description:
        "Revoke/reset the current invite link for a WhatsApp group. This invalidates the existing link and generates a new one. Requires admin privileges.",
      inputSchema: {
        jid: z.string().describe("Group JID (e.g. 123456789-0123456789@g.us)"),
      },
    },
    async ({ jid }) => {
      return toolOk(await runWacli(config, ["groups", "invite", "link", "revoke"], { jid }));
    },
  );

  // ─── Participant operations ─────────────────────────────────────────────

  server.registerTool(
    "wacli_groups_participants_add",
    {
      title: "Add Group Participants",
      description:
        "Add participants to a WhatsApp group. Requires admin privileges. Can add multiple users at once. User identifiers can be phone numbers (with country code) or JIDs.",
      inputSchema: {
        jid: z.string().describe("Group JID (e.g. 123456789-0123456789@g.us)"),
        users: z.array(z.string()).min(1).describe("List of users to add (phone numbers or JIDs)"),
      },
    },
    async ({ jid, users }) => {
      return toolOk(await runWacli(config, ["groups", "participants", "add"], { jid, user: users }));
    },
  );

  server.registerTool(
    "wacli_groups_participants_remove",
    {
      title: "Remove Group Participants",
      description:
        "Remove participants from a WhatsApp group. Requires admin privileges. This action is visible to group members. Can remove multiple users at once.",
      inputSchema: {
        jid: z.string().describe("Group JID (e.g. 123456789-0123456789@g.us)"),
        users: z.array(z.string()).min(1).describe("List of users to remove (phone numbers or JIDs)"),
      },
    },
    async ({ jid, users }) => {
      return toolOk(await runWacli(config, ["groups", "participants", "remove"], { jid, user: users }));
    },
  );

  server.registerTool(
    "wacli_groups_participants_promote",
    {
      title: "Promote Group Participants",
      description:
        "Promote participants to group admins. Requires admin privileges. Promoted users can manage group settings and other participants.",
      inputSchema: {
        jid: z.string().describe("Group JID (e.g. 123456789-0123456789@g.us)"),
        users: z.array(z.string()).min(1).describe("List of users to promote (phone numbers or JIDs)"),
      },
    },
    async ({ jid, users }) => {
      return toolOk(await runWacli(config, ["groups", "participants", "promote"], { jid, user: users }));
    },
  );

  server.registerTool(
    "wacli_groups_participants_demote",
    {
      title: "Demote Group Admins",
      description:
        "Demote group admins to regular participants. Requires admin privileges. Demoted users lose their ability to manage the group.",
      inputSchema: {
        jid: z.string().describe("Group JID (e.g. 123456789-0123456789@g.us)"),
        users: z.array(z.string()).min(1).describe("List of users to demote (phone numbers or JIDs)"),
      },
    },
    async ({ jid, users }) => {
      return toolOk(await runWacli(config, ["groups", "participants", "demote"], { jid, user: users }));
    },
  );
}
