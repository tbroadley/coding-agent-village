import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import axios from 'axios';

export interface Message {
  id: number;
  sender: string;
  senderType: 'agent' | 'human';
  content: string;
  timestamp: string;
}

export class MCPMessagingClient {
  private mcpServerUrl: string;
  private agentName: string;
  private lastMessageTimestamp: string | null = null;
  private client: Client | null = null;

  constructor(mcpServerUrl: string, agentName: string) {
    this.mcpServerUrl = mcpServerUrl;
    this.agentName = agentName;
  }

  /**
   * Initialize MCP client connection
   */
  async initialize(): Promise<void> {
    try {
      // For HTTP-based MCP, we'll use REST API
      // MCP stdio transport would require spawning the MCP server as a subprocess
      // For now, we'll use HTTP REST API
      console.log(`MCP client initialized for agent: ${this.agentName}`);
    } catch (error) {
      console.error('Error initializing MCP client:', error);
      throw error;
    }
  }

  /**
   * Get latest messages from the channel
   */
  async getLatestMessages(limit: number = 50): Promise<Message[]> {
    try {
      const response = await axios.get(`${this.mcpServerUrl}/api/messages`, {
        params: { limit, channel: 'public' },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Get new messages since last check
   */
  async getNewMessages(): Promise<Message[]> {
    try {
      if (!this.lastMessageTimestamp) {
        // First time, get latest messages
        const messages = await this.getLatestMessages(50);
        if (messages.length > 0) {
          this.lastMessageTimestamp = messages[messages.length - 1].timestamp;
        }
        return messages;
      }

      const response = await axios.get(
        `${this.mcpServerUrl}/api/messages/since/${this.lastMessageTimestamp}`
      );
      const messages = response.data;
      
      if (messages.length > 0) {
        this.lastMessageTimestamp = messages[messages.length - 1].timestamp;
      }
      
      return messages;
    } catch (error) {
      console.error('Error fetching new messages:', error);
      return [];
    }
  }

  /**
   * Send a message to the channel
   */
  async sendMessage(content: string): Promise<Message> {
    try {
      const response = await axios.post(`${this.mcpServerUrl}/api/messages`, {
        sender: this.agentName,
        senderType: 'agent',
        content,
        channel: 'public',
      });
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Start polling for new messages
   */
  startPolling(
    onMessage: (message: Message) => void,
    intervalMs: number = 2000
  ): () => void {
    const interval = setInterval(async () => {
      try {
        const messages = await this.getNewMessages();
        for (const message of messages) {
          // Don't process our own messages
          if (message.sender !== this.agentName) {
            onMessage(message);
          }
        }
      } catch (error) {
        console.error('Error in message polling:', error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }
}

