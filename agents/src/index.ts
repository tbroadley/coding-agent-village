import { ClaudeAgent } from './claude-agent.js';
import { CodexAgent } from './codex-agent.js';

const AGENT_TYPE = process.env.AGENT_TYPE || 'claude';
const AGENT_NAME = process.env.AGENT_NAME || 'agent';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://mcp-server:8080';

async function main() {
  console.log(`Starting ${AGENT_TYPE} agent: ${AGENT_NAME}`);

  let agent: ClaudeAgent | CodexAgent;

  if (AGENT_TYPE === 'claude') {
    agent = new ClaudeAgent(MCP_SERVER_URL, AGENT_NAME);
  } else if (AGENT_TYPE === 'codex') {
    agent = new CodexAgent(MCP_SERVER_URL, AGENT_NAME);
  } else {
    throw new Error(`Unknown agent type: ${AGENT_TYPE}`);
  }

  await agent.start();

  // Keep process alive
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

