import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface WacliMcpConfig {
  storePath: string;
  wacliPath: string;
  transport: "stdio" | "http";
  httpPort: number;
  enabledTools: string[];
  allowedTools: string[] | null;
  toolTimeoutMs: number;
}

const DEFAULT_CONFIG: WacliMcpConfig = {
  storePath: "~/.wacli",
  wacliPath: "wacli",
  transport: "stdio",
  httpPort: 3110,
  enabledTools: ["chats", "messages", "contacts", "groups", "send", "media"],
  allowedTools: null,
  toolTimeoutMs: 30000,
};

export function loadConfig(configPath?: string): WacliMcpConfig {
  const paths = [
    configPath,
    process.env.WACLI_MCP_CONFIG,
    join(process.cwd(), "config.json"),
    join(__dirname, "..", "config.json"),
    join(__dirname, "..", "..", "config.json"),
    join(process.env.HOME || "", ".config", "wacli-mcp", "config.json"),
  ].filter(Boolean) as string[];

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, "utf-8");
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      } catch {}
    }
  }

  return DEFAULT_CONFIG;
}
