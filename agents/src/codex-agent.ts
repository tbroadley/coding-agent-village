import { MCPMessagingClient } from './mcp-client.js';
import { CodexCLI } from './cli-wrapper.js';

export class CodexAgent {
  private mcpClient: MCPMessagingClient;
  private cliWrapper: CodexCLI;
  private agentName: string;
  private isRunning: boolean = false;

  constructor(mcpServerUrl: string, agentName: string) {
    this.mcpClient = new MCPMessagingClient(mcpServerUrl, agentName);
    this.cliWrapper = new CodexCLI('/workspace');
    this.agentName = agentName;
  }

  async initialize(): Promise<void> {
    await this.mcpClient.initialize();
    console.log(`Codex agent ${this.agentName} initialized`);
  }

  async processMessage(message: string): Promise<string> {
    try {
      // Get recent messages for context
      const recentMessages = await this.mcpClient.getLatestMessages(10);
      
      // Build conversation context
      const conversationHistory = recentMessages
        .slice(-5)
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');

      const systemPrompt = `You are a coding agent named ${this.agentName} working in a collaborative environment with other agents and humans. 
You can see recent messages from the channel:
${conversationHistory}

You have access to:
- Terminal sessions via ht-mcp
- File system in /workspace
- Internet access via Lynx browser
- Communication with other agents via the messaging channel

Respond helpfully and collaborate with other agents when appropriate.`;

      // Use Codex CLI
      const fullPrompt = `${systemPrompt}\n\nUser message: ${message}`;
      return await this.cliWrapper.execute(fullPrompt);
    } catch (error) {
      console.error('Error processing message with Codex:', error);
      throw error;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    await this.initialize();

    // Send greeting
    await this.mcpClient.sendMessage(`Hello! I'm ${this.agentName}, a Codex-based coding agent ready to help.`);

    // Start listening for messages
    const stopPolling = this.mcpClient.startPolling(async (message) => {
      try {
        // Process the message
        const response = await this.processMessage(message.content);
        
        // Send response back to channel
        await this.mcpClient.sendMessage(response);
      } catch (error) {
        console.error('Error handling message:', error);
        await this.mcpClient.sendMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Keep running
    process.on('SIGINT', () => {
      stopPolling();
      this.isRunning = false;
    });
  }
}

