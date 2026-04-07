import { spawn } from "child_process";
import { homedir } from "os";
import { resolve } from "path";
import type { WacliMcpConfig } from "./config.js";
import type { WacliResult } from "./types.js";

function resolveHome(filepath: string): string {
  if (filepath.startsWith("~")) {
    return homedir() + filepath.slice(1);
  }
  return filepath;
}

export async function runWacli(
  config: WacliMcpConfig,
  command: string[],
  extraFlags: Record<string, unknown> = {},
): Promise<WacliResult> {
  const args: string[] = ["--json"];

  const storePath = resolveHome(
    (extraFlags.store as string) || config.storePath,
  );
  if (storePath) {
    args.push("--store", storePath);
  }

  args.push(...command);

  for (const [key, value] of Object.entries(extraFlags)) {
    if (key === "store") continue;
    if (value === undefined || value === null) continue;

    const flag = `--${key}`;
    if (typeof value === "boolean") {
      if (value) args.push(flag);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        args.push(flag, String(item));
      }
    } else {
      args.push(flag, String(value));
    }
  }

  return execWacli(config.wacliPath, args, config.toolTimeoutMs);
}

export async function runWacliDry(
  config: WacliMcpConfig,
  command: string[],
  extraFlags: Record<string, unknown> = {},
): Promise<WacliResult> {
  return runWacli(config, command, { ...extraFlags, dryRun: true });
}

async function execWacli(
  wacliPath: string,
  args: string[],
  timeoutMs: number,
): Promise<WacliResult> {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";

    const proc = spawn(wacliPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const timeoutId = setTimeout(() => {
      proc.kill("SIGTERM");
    }, timeoutMs);

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: `Failed to spawn wacli: ${err.message}. Ensure wacli is installed and in PATH.`,
      });
    });

    proc.on("close", (exitCode) => {
      clearTimeout(timeoutId);
      if (exitCode === 0) {
        try {
          const trimmed = stdout.trim();
          if (!trimmed) {
            resolve({ success: true, data: null });
            return;
          }
          resolve({ success: true, data: JSON.parse(trimmed) });
        } catch {
          resolve({ success: true, data: stdout.trim() });
        }
      } else {
        resolve({
          success: false,
          error: parseWacliError(exitCode, stderr, stdout),
          exitCode: exitCode ?? -1,
          stderr: stderr.trim(),
        });
      }
    });
  });
}

const EXIT_MESSAGES: Record<number, string> = {
  0: "OK",
  1: "General error",
  2: "Usage error",
  3: "No results found",
  4: "Authentication required",
  5: "Not found",
  6: "Permission denied",
  7: "Rate limited",
  8: "Retryable error",
  10: "Configuration error",
  130: "Cancelled (user interrupt)",
};

function parseWacliError(
  exitCode: number | null,
  stderr: string,
  stdout: string,
): string {
  const base = EXIT_MESSAGES[exitCode ?? 1] || `Unknown error (exit ${exitCode})`;
  const detail = stderr.trim() || stdout.trim();
  return detail ? `${base}: ${detail}` : base;
}
