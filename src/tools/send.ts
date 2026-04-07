import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import type { WacliMcpConfig } from "../config.js";
import { runWacli } from "../wacli.js";
import { toolOk } from "../types.js";

export function registerSendTools(server: McpServer, config: WacliMcpConfig) {
  server.registerTool(
    "wacli_send_text",
    {
      title: "Send Text Message",
      description:
        "Send a text message to a WhatsApp contact or group. The 'to' field accepts a phone number with country code (e.g., +919876543210) or a JID (e.g., 919876543210@s.whatsapp.net for DMs or group-id@g.us for groups). WARNING: This sends an actual message — verify the recipient before calling.",
      inputSchema: {
        to: z.string().describe("Recipient phone number with country code (e.g., +919876543210) or JID (e.g., 919876543210@s.whatsapp.net or group-id@g.us)"),
        message: z.string().describe("Text message content to send"),
      },
    },
    async ({ to, message }) => {
      return toolOk(await runWacli(config, ["send", "text"], { to, message }));
    },
  );

  server.registerTool(
    "wacli_send_file",
    {
      title: "Send File",
      description:
        "Send a file (image, video, audio, or document) to a WhatsApp contact or group. The 'file' field is the local filesystem path. Optionally provide caption (for images/videos/documents), filename (display name, defaults to basename), and mime type override. WARNING: This sends an actual file — verify the recipient and file path before calling.",
      inputSchema: {
        to: z.string().describe("Recipient phone number with country code (e.g., +919876543210) or JID (e.g., 919876543210@s.whatsapp.net or group-id@g.us)"),
        file: z.string().describe("Local filesystem path to the file to send"),
        caption: z.string().optional().describe("Caption for the file (for images, videos, documents)"),
        filename: z.string().optional().describe("Display filename (defaults to basename of file path)"),
        mime: z.string().optional().describe("MIME type override (e.g., image/png, video/mp4)"),
      },
    },
    async ({ to, file, caption, filename, mime }) => {
      const flags: Record<string, unknown> = { to, file };
      if (caption) flags.caption = caption;
      if (filename) flags.filename = filename;
      if (mime) flags.mime = mime;
      return toolOk(await runWacli(config, ["send", "file"], flags));
    },
  );
}
