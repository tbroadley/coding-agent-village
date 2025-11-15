#!/bin/bash
# Setup script for ht-mcp in agent containers
# This script configures ht to stream to the asciinema server

set -e

ASCIINEMA_SERVER_URL=${ASCIINEMA_SERVER_URL:-http://asciinema-server:3000}
AGENT_NAME=${AGENT_NAME:-unknown}

# Create directory for ht sessions
mkdir -p /tmp/ht-sessions

# Export session metadata
echo "Agent: $AGENT_NAME" > /tmp/ht-sessions/metadata.txt
echo "Started: $(date -Iseconds)" >> /tmp/ht-sessions/metadata.txt

# Note: ht-mcp will be configured to use this asciinema server URL
# The actual streaming will be handled by the agent's MCP client
# which will call ht-mcp tools to start new terminal sessions

echo "ht setup complete for agent: $AGENT_NAME"
echo "Asciinema server: $ASCIINEMA_SERVER_URL"

