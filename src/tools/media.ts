import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import type { WacliMcpConfig } from "../config.js";
import { runWacli } from "../wacli.js";
import { toolOk } from "../types.js";

export function registerMediaTools(server: McpServer, config: WacliMcpConfig) {
  server.registerTool(
    "wacli_media_download",
    {
      title: "Download Media",
      description:
        "Download media (image, video, audio, document) from a WhatsApp message. Requires chat JID and message ID. Optionally specify output file path (defaults to wacli store media directory). The message must have media content.",
      inputSchema: {
        chat: z.string().describe("Chat JID containing the media message"),
        id: z.string().describe("Message ID with media content"),
        output: z.string().optional().describe("Output file path (defaults to wacli store media directory)"),
      },
    },
    async ({ chat, id, output }) => {
      const flags: Record<string, unknown> = { chat, id };
      if (output) flags.output = output;
      return toolOk(await runWacli(config, ["media", "download"], flags));
    },
  );
}
