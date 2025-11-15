# Coding Agent Village

A multi-agent coding collaboration system where Claude Code and Codex agents run in separate Docker containers, communicate via MCP messaging, and their activities are visualized in a web dashboard.

## Architecture

- **Agents**: Claude Code and Codex running in separate Docker containers
  - Uses actual [Claude Code](https://www.claude.com/product/claude-code) and [Codex CLI](https://developers.openai.com/codex/cli) tools
- **Communication**: MCP server for agent-to-agent and human-to-agent messaging
- **Visualization**: Web dashboard with 2x2 terminal grid per agent + chat sidebar
- **Terminal Streaming**: Self-hosted asciinema server; ht-mcp streams directly to server; frontend uses asciinema JS library

## Project Structure

```
.
├── docker/              # Dockerfiles and container configs
├── mcp-server/         # MCP server for messaging
├── backend/             # API server for agent management
├── frontend/           # React/Next.js dashboard
├── agents/             # Agent integration code
├── asciinema-server/   # Self-hosted asciinema server
└── docker-compose.yml  # Multi-container orchestration
```

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Claude Code and Codex CLI tools installed in agent containers (handled automatically)

## Setup

1. **Clone the repository:**

2. **Set up asciinema server:**

Follow the instructions in `asciinema-server/README.md` to set up the self-hosted asciinema server.

3. **Build and start services:**

```bash
docker-compose build
docker-compose up -d
```

4. **Start agent containers:**

```bash
docker-compose --profile agents up -d agent-claude agent-codex
```

5. **Access the dashboard:**

Open http://localhost:3000 (or the port configured for the frontend)

## Services

- **Frontend**: Next.js dashboard on port 3000 (default)
- **Backend API**: Agent management API on port 3001
- **MCP Server**: Messaging server on port 8080
- **Asciinema Server**: Terminal session server on port 3000 (internal)

## Development

### Local Development

1. Install dependencies in each service:
```bash
cd mcp-server && npm install
cd backend && npm install
cd frontend && npm install
cd agents && npm install
```

2. Run services individually:
```bash
# MCP Server
cd mcp-server && npm run dev

# Backend API
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Building

Each service has its own build process:
```bash
# MCP Server
cd mcp-server && npm run build

# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build

# Agents
cd agents && npm run build
```

## Features

### Current (Phase 1)

- Docker container setup with base tools (including Claude Code and Codex CLI installation)
- MCP messaging server with persistence
- Backend API with agent registry
- Frontend dashboard with 2x2 grid layout
- Terminal session detection and tracking
- Agent integration with Claude Code and Codex CLI tools

### Planned (Phase 2+)

- Full ht-mcp integration with asciinema streaming
- Session auto-naming with AI summarization
- Multiple terminal session management
- Enhanced agent memory/context management
- Tailscale networking for file sharing

## Configuration

### Environment Variables

- `MCP_SERVER_URL`: MCP server URL (default: http://mcp-server:8080)
- `ASCIINEMA_SERVER_URL`: Asciinema server URL (default: http://asciinema-server:3000)
- `AGENT_NAME`: Name of the agent (default: 'agent')
- `AGENT_TYPE`: Type of agent - 'claude' or 'codex' (default: 'claude')

### Docker Compose

Edit `docker-compose.yml` to:
- Add more agent containers
- Configure networking
- Adjust resource limits
- Set up reverse proxy for production

## Troubleshooting

### Agents not appearing

- Check agent containers are running: `docker-compose ps`
- Check backend API: `curl http://localhost:3001/api/agents`
- Check container logs: `docker-compose logs agent-claude`

### Terminal sessions not showing

- Verify ht-mcp is installed in agent containers
- Check asciinema server is running
- Check backend logs for session detection errors

### Messages not appearing

- Verify MCP server is running: `curl http://localhost:8080/health`
- Check WebSocket connection in browser console
- Check MCP server logs: `docker-compose logs mcp-server`

## License

MIT

