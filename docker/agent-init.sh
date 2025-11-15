#!/bin/bash
# Agent container initialization script

set -e

echo "Initializing agent: $AGENT_NAME (type: $AGENT_TYPE)"

# Run ht setup
/usr/local/bin/ht-setup.sh

# Start tailscale (if configured)
# Note: Tailscale requires authentication, so this is optional
# if [ -n "$TAILSCALE_AUTH_KEY" ]; then
#   tailscale up --authkey="$TAILSCALE_AUTH_KEY"
# fi

# Start the agent process
echo "Starting agent process..."
cd /app/agents
node dist/index.js &

# Keep container running
wait

