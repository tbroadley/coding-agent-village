import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { MessageStore, Message } from './message-store.js';
import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';

const MESSAGE_STORE_PATH = process.env.DATABASE_URL?.replace('sqlite://', '') || '/app/data/messages.db';
const PORT = parseInt(process.env.PORT || '8080', 10);

// Initialize message store
const messageStore = new MessageStore(MESSAGE_STORE_PATH);

// MCP Server
const server = new Server(
  {
    name: 'messaging-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_latest_messages',
        description: 'Get the latest messages from the public channel',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of messages to retrieve (default: 50)',
              default: 50,
            },
            channel: {
              type: 'string',
              description: 'Channel name (default: "public")',
              default: 'public',
            },
          },
        },
      },
      {
        name: 'send_message',
        description: 'Send a message to the public channel',
        inputSchema: {
          type: 'object',
          properties: {
            sender: {
              type: 'string',
              description: 'Name of the sender',
            },
            senderType: {
              type: 'string',
              description: 'Type of sender: "agent" or "human"',
              enum: ['agent', 'human'],
            },
            content: {
              type: 'string',
              description: 'Message content',
            },
            channel: {
              type: 'string',
              description: 'Channel name (default: "public")',
              default: 'public',
            },
          },
          required: ['sender', 'senderType', 'content'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_latest_messages': {
        const limit = (args as any)?.limit || 50;
        const channel = (args as any)?.channel || 'public';
        const messages = messageStore.getLatestMessages(limit, channel);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(messages, null, 2),
            },
          ],
        };
      }

      case 'send_message': {
        const { sender, senderType, content, channel = 'public' } = args as any;
        
        if (!sender || !senderType || !content) {
          throw new Error('Missing required fields: sender, senderType, content');
        }

        if (senderType !== 'agent' && senderType !== 'human') {
          throw new Error('senderType must be "agent" or "human"');
        }

        const message = messageStore.addMessage(sender, senderType, content, channel);
        
        // Broadcast to WebSocket clients
        broadcastMessage(message);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(message, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// HTTP/WebSocket server for real-time updates
const app = express();
app.use(express.json());

const httpServer = http.createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const clients = new Set<any>();

// WebSocket connection handling
wss.on('connection', (ws) => {
  clients.add(ws);
  
  // Send initial message history
  const messages = messageStore.getLatestMessages(50);
  ws.send(JSON.stringify({ type: 'history', messages }));

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

function broadcastMessage(message: Message): void {
  const data = JSON.stringify({ type: 'message', message });
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(data);
    }
  });
}

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/messages', (req, res) => {
  const limit = parseInt(req.query.limit as string || '50', 10);
  const channel = (req.query.channel as string) || 'public';
  const messages = messageStore.getLatestMessages(limit, channel);
  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  const { sender, senderType, content, channel = 'public' } = req.body;
  
  if (!sender || !senderType || !content) {
    return res.status(400).json({ error: 'Missing required fields: sender, senderType, content' });
  }

  if (senderType !== 'agent' && senderType !== 'human') {
    return res.status(400).json({ error: 'senderType must be "agent" or "human"' });
  }

  try {
    const message = messageStore.addMessage(sender, senderType, content, channel);
    broadcastMessage(message);
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/messages/since/:timestamp', (req, res) => {
  const { timestamp } = req.params;
  const channel = (req.query.channel as string) || 'public';
  const messages = messageStore.getMessagesSince(timestamp, channel);
  res.json(messages);
});

// Start HTTP/WebSocket server
httpServer.listen(PORT, () => {
  console.log(`MCP Messaging Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api`);
});

// Start MCP server (stdio transport for MCP protocol)
if (process.stdin.isTTY) {
  // If running as standalone, start stdio transport
  const transport = new StdioServerTransport();
  server.connect(transport);
  console.log('MCP server started (stdio transport)');
} else {
  // Otherwise, just run the HTTP server
  console.log('Running in HTTP-only mode (no stdio transport)');
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  messageStore.close();
  httpServer.close();
  process.exit(0);
});

