# wacli-mcp

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![MCP](https://img.shields.io/badge/MCP-1.12-orange)
![License](https://img.shields.io/badge/License-MIT-green)

**WhatsApp as MCP tools** — 28 tools for messages, chats, contacts, groups, media, and send. Built on the [wacli CLI](https://github.com/steipete/wacli), designed for AI agents.

## Quick Start

### 1. Install wacli

The AUR package may be built without FTS5 search support. Build from source to ensure full functionality:

```bash
# Clone wacli main branch (includes latest WhatsApp Web client version)
cd /tmp && git clone --branch main --depth 1 https://github.com/steipete/wacli.git wacli-build
cd wacli-build

# Build with FTS5 support (CGO required)
CGO_ENABLED=1 go build -trimpath -ldflags='-s -w' -tags "fts5" -o wacli ./cmd/wacli

# Install to PATH
cp wacli ~/go/bin/wacli
```

### 2. Authenticate

```bash
wacli auth
# Scan the QR code with WhatsApp > Linked Devices
```

### 3. Initial Sync

```bash
wacli sync --once
# Downloads existing messages into local DB
```

### 4. Setup wacli-mcp

```bash
git clone https://github.com/ishan-parihar/wacli-mcp.git
cd wacli-mcp
npm install
npm run build

# Create config
cp config.example.json config.json
# Edit wacliPath if not in PATH
```

## Architecture

```
┌─────────────┐     JSON-RPC      ┌──────────────┐     spawns       ┌──────────┐     ┌───────────┐
│  MCP Client │ ◄───────────────► │  wacli-mcp   │ ───────────────► │ wacli CLI│ ◄─► │ WhatsApp  │
│  (Claude,   │                  │  (MCP Server)│     --json       │  (Go)    │     │  Servers  │
│   Cursor)   │                  │  28 tools    │ ◄─────────────── │          │     │           │
└─────────────┘                  └──────────────┘    parse JSON    └──────────┘     └───────────┘
                                                       │
                                                       ▼
                                                ┌──────────────┐
                                                │  SQLite DB   │
                                                │  (~/.wacli)  │
                                                └──────────────┘
```

## Tools (28 total)

| Module | Count | Tools |
|--------|-------|-------|
| **chats** | 2 | `wacli_chats_list`, `wacli_chats_show` |
| **messages** | 4 | `wacli_messages_list`, `wacli_messages_search`, `wacli_messages_show`, `wacli_messages_context` |
| **contacts** | 7 | `wacli_contacts_search`, `wacli_contacts_show`, `wacli_contacts_refresh`, `wacli_contacts_alias_set`, `wacli_contacts_alias_rm`, `wacli_contacts_tag_add`, `wacli_contacts_tag_rm` |
| **groups** | 12 | `wacli_groups_list`, `wacli_groups_info`, `wacli_groups_refresh`, `wacli_groups_rename`, `wacli_groups_leave`, `wacli_groups_join`, `wacli_groups_invite_link_get`, `wacli_groups_invite_link_revoke`, `wacli_groups_participants_add`, `wacli_groups_participants_remove`, `wacli_groups_participants_promote`, `wacli_groups_participants_demote` |
| **send** | 2 | `wacli_send_text`, `wacli_send_file` |
| **media** | 1 | `wacli_media_download` |

### Example Tool Calls

```
List my chats → wacli_chats_list(limit: 20)
Search messages → wacli_messages_search(query: "meeting", chat: "...@g.us")
Find a contact → wacli_contacts_search(query: "john")
List groups → wacli_groups_list()
Send a message → wacli_send_text(to: "+919876543210", message: "Hello")
```

## Per-Agent Configuration

For use with multi-agent systems like [Strategos](https://github.com/ishan-parihar/strategos), use role-specific configs:

| Config | Agent | Access |
|--------|-------|--------|
| `config.ceo.json` | CEO | Full access (all 28 tools) |
| `config.cio.json` | CIO | Read-only intel (chats, messages, contacts read, groups read, media) |
| `config.cro.json` | CRO | Relationship-focused (full contacts, read messages/groups) |
| `config.cmo.json` | CMO | Content ops (all modules including send + full groups) |
| `config.coo.json` | COO | Operational (read + send_text, no group mutations) |
| `config.cfo.json` | CFO | Read-only finance (chats, contacts, messages — list/search only) |
| `config.cpo.json` | CPO | Minimal read (chats list, messages list/search, contacts search) |
| `config.physician.json` | Physician | Minimal (chats list, contacts search) |

See [`examples/strategos-bridge.yaml`](examples/strategos-bridge.yaml) for full per-agent tool scoping.

## MCP Client Integration

### OpenCode

```json
{
  "mcp": {
    "wacli-mcp": {
      "command": "node",
      "args": ["/path/to/wacli-mcp/dist/index.js"],
      "env": {
        "WACLI_MCP_CONFIG": "/path/to/wacli-mcp/config.json"
      }
    }
  }
}
```

### Claude Desktop / Cursor

See [`examples/mcp-clients.json`](examples/mcp-clients.json) for ready-to-use templates.

## Configuration

```json
{
  "storePath": "~/.wacli",
  "wacliPath": "/home/user/go/bin/wacli",
  "transport": "stdio",
  "httpPort": 3110,
  "enabledTools": ["chats", "messages", "contacts", "groups", "send", "media"],
  "allowedTools": null,
  "toolTimeoutMs": 30000
}
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `storePath` | string | `~/.wacli` | Path to wacli data store |
| `wacliPath` | string | `wacli` | Path to wacli binary |
| `transport` | string | `stdio` | `stdio` for local agents, `http` for remote |
| `httpPort` | number | `3110` | Port for HTTP transport |
| `enabledTools` | string[] | all modules | Modules to expose. Remove any to disable. |
| `allowedTools` | string[] | `null` | Glob patterns to restrict tool registration. `null` = all tools. |
| `toolTimeoutMs` | number | `30000` | Timeout per wacli command (ms) |

### Tool Scoping

Use `allowedTools` to restrict which tools the server registers. Supports glob patterns (`*`, `**`):

```json
{
  "enabledTools": ["chats", "messages", "contacts"],
  "allowedTools": [
    "wacli_chats_*",
    "wacli_messages_search",
    "wacli_contacts_*"
  ]
}
```

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm run typecheck    # Type check without emitting
npm run dev          # Watch mode
npm start            # Run with current config
```

## Project Structure

```
wacli-mcp/
├── src/
│   ├── index.ts           # Entry point: auth check → module registration → transport
│   ├── config.ts          # Cascading config loader
│   ├── wacli.ts           # CLI executor (spawn, JSON parse, exit codes)
│   ├── types.ts           # WacliResult, ToolResult, toolOk()
│   ├── tool-filter.ts     # Glob-based tool filtering for per-agent scoping
│   └── tools/
│       ├── chats.ts       # 2 tools
│       ├── messages.ts    # 4 tools
│       ├── contacts.ts    # 7 tools
│       ├── groups.ts      # 12 tools
│       ├── send.ts        # 2 tools
│       └── media.ts       # 1 tool
├── config.example.json    # Base config template
├── config.ceo.json        # CEO: full access
├── config.cio.json        # CIO: read-only intel
├── config.cro.json        # CRO: relationship-focused
├── config.cmo.json        # CMO: content ops
├── config.coo.json        # COO: operational
├── config.cfo.json        # CFO: read-only finance
├── config.cpo.json        # CPO: minimal read
├── config.physician.json  # Physician: minimal
├── examples/
│   ├── strategos-bridge.yaml  # Per-agent MCP tool scoping
│   └── mcp-clients.json       # Claude Desktop / Cursor / OpenCode templates
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### "Client outdated (405)"

The AUR `wacli` package may lag behind WhatsApp's web client version updates. Build from `main` branch:

```bash
cd /tmp && git clone --branch main --depth 1 https://github.com/steipete/wacli.git wacli-build
cd wacli-build
CGO_ENABLED=1 go build -trimpath -ldflags='-s -w' -tags "fts5" -o wacli ./cmd/wacli
cp wacli ~/go/bin/wacli
```

### "no such module: fts5"

Your wacli binary was built without SQLite FTS5 support. Rebuild with the `-tags "fts5"` flag as shown above.

### "wacli not authenticated"

Run `wacli auth` and scan the QR code with WhatsApp. The MCP server checks auth on startup and will refuse to start if not authenticated.

### Group operations fail with "websocket disconnected"

Operations like `wacli_groups_info`, `wacli_groups_refresh`, and invite management require an active connection to WhatsApp servers. Run `wacli sync --follow` in a background terminal first.

## License

MIT
