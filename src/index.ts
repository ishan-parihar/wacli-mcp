import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "http";
import { createFilteredServer } from "./tool-filter.js";
import { loadConfig } from "./config.js";
import { registerChatsTools } from "./tools/chats.js";
import { registerMessagesTools } from "./tools/messages.js";
import { registerContactsTools } from "./tools/contacts.js";
import { registerGroupsTools } from "./tools/groups.js";
import { registerSendTools } from "./tools/send.js";
import { registerMediaTools } from "./tools/media.js";

const config = loadConfig(process.argv.includes("--config")
  ? process.argv[process.argv.indexOf("--config") + 1]
  : undefined);

const transportFlag = process.argv.includes("--transport")
  ? process.argv[process.argv.indexOf("--transport") + 1]
  : config.transport;

const portFlag = parseInt(process.argv.includes("--port")
  ? process.argv[process.argv.indexOf("--port") + 1]
  : String(config.httpPort), 10);

async function checkAuth(): Promise<boolean> {
  const { runWacli } = await import("./wacli.js");
  const result = await runWacli(config, ["auth", "status"]);
  return result.success;
}

async function bootstrap() {
  const authenticated = await checkAuth();
  if (!authenticated) {
    process.stderr.write("wacli not authenticated. Run 'wacli auth' first.\n");
    process.exit(1);
  }

  const server = createFilteredServer(
    { name: "wacli-mcp", version: "0.1.0" },
    { capabilities: { logging: {} } },
    config.allowedTools,
  );

  const moduleMap: Record<string, (s: McpServer, c: typeof config) => void> = {
    chats: registerChatsTools,
    messages: registerMessagesTools,
    contacts: registerContactsTools,
    groups: registerGroupsTools,
    send: registerSendTools,
    media: registerMediaTools,
  };

  const enabled = config.enabledTools.filter((t) => t in moduleMap);
  for (const mod of enabled) {
    moduleMap[mod](server, config);
  }

  if (transportFlag === "http") {
    const transportsBySessionId = new Map<string, StreamableHTTPServerTransport>();

    const httpServer = createServer(async (req, res) => {
      if (req.method === "POST") {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        let transport: StreamableHTTPServerTransport;

        if (sessionId && transportsBySessionId.has(sessionId)) {
          transport = transportsBySessionId.get(sessionId)!;
        } else {
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => Math.random().toString(36).slice(2),
            onsessioninitialized: (sid) => {
              transportsBySessionId.set(sid, transport);
            },
          });
          transport.onclose = () => {
            if (transport.sessionId) transportsBySessionId.delete(transport.sessionId);
          };
          await server.connect(transport);
        }

        let body = "";
        for await (const chunk of req) body += chunk;
        const parsedReq = Object.assign(req, { body: JSON.parse(body) });
        await transport.handleRequest(parsedReq, res);
      } else if (req.method === "GET") {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        if (!sessionId || !transportsBySessionId.has(sessionId)) {
          res.writeHead(400).end("Missing or invalid session");
          return;
        }
        const transport = transportsBySessionId.get(sessionId)!;
        await transport.handleRequest(req, res);
      } else if (req.method === "DELETE") {
        const sessionId = req.headers["mcp-session-id"] as string | undefined;
        if (sessionId && transportsBySessionId.has(sessionId)) {
          const transport = transportsBySessionId.get(sessionId)!;
          await transport.handleRequest(req, res);
        } else {
          res.writeHead(400).end("Missing or invalid session");
        }
      } else {
        res.writeHead(405).end("Method not allowed");
      }
    });

    httpServer.listen(portFlag, () => {
      process.stderr.write(`wacli-mcp HTTP server listening on port ${portFlag}\n`);
      process.stderr.write(`Enabled modules: ${enabled.join(", ")}\n`);
      if (config.allowedTools?.length) {
        process.stderr.write(`Allowed tools: ${config.allowedTools.join(", ")}\n`);
      }
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    process.stderr.write("wacli-mcp stdio server started\n");
    process.stderr.write(`Enabled modules: ${enabled.join(", ")}\n`);
    if (config.allowedTools?.length) {
      process.stderr.write(`Allowed tools: ${config.allowedTools.join(", ")}\n`);
    }
  }
}

bootstrap().catch((err) => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
