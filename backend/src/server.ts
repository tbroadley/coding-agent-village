import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { AgentRegistry } from './agent-registry.js';
import { HtManager } from './ht-manager.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://mcp-server:8080';
const ASCIINEMA_SERVER_URL = process.env.ASCIINEMA_SERVER_URL || 'http://asciinema-server:3000';

const app = express();
app.use(cors());
app.use(express.json());

const agentRegistry = new AgentRegistry();
const htManager = new HtManager(agentRegistry, ASCIINEMA_SERVER_URL);

// Start polling for agent containers
agentRegistry.startPolling(5000);

// Start scanning for ht sessions
htManager.startScanning(5000);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all agents
app.get('/api/agents', (req, res) => {
  const agents = agentRegistry.getAllAgents();
  res.json(agents);
});

// Get specific agent
app.get('/api/agents/:agentId', (req, res) => {
  const { agentId } = req.params;
  const agent = agentRegistry.getAgent(agentId);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json(agent);
});

// Get terminal sessions for an agent
app.get('/api/agents/:agentId/sessions', async (req, res) => {
  const { agentId } = req.params;
  
  try {
    const sessions = await agentRegistry.getTerminalSessions(agentId);
    res.json(sessions);
  } catch (error) {
    res.status(404).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Register a new terminal session
app.post('/api/agents/:agentId/sessions', async (req, res) => {
  const { agentId } = req.params;
  const { sessionId, asciinemaId, name } = req.body;
  
  try {
    const session = await agentRegistry.addTerminalSession(agentId, sessionId, asciinemaId, name);
    res.json(session);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update terminal session
app.patch('/api/agents/:agentId/sessions/:sessionId', async (req, res) => {
  const { agentId, sessionId } = req.params;
  const updates = req.body;
  
  try {
    await agentRegistry.updateTerminalSession(agentId, sessionId, updates);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Proxy to MCP server - get messages
app.get('/api/messages', async (req, res) => {
  try {
    const response = await axios.get(`${MCP_SERVER_URL}/api/messages`, {
      params: req.query,
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Proxy to MCP server - send message
app.post('/api/messages', async (req, res) => {
  try {
    const response = await axios.post(`${MCP_SERVER_URL}/api/messages`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get asciinema server info
app.get('/api/asciinema/info', (req, res) => {
  res.json({
    url: ASCIINEMA_SERVER_URL,
    apiUrl: `${ASCIINEMA_SERVER_URL}/api`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
  console.log(`MCP Server: ${MCP_SERVER_URL}`);
  console.log(`Asciinema Server: ${ASCIINEMA_SERVER_URL}`);
});

