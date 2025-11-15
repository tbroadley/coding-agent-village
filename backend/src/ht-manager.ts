import Docker from 'dockerode';
import axios from 'axios';
import { AgentRegistry, TerminalSession } from './agent-registry.js';

export interface HtSessionInfo {
  sessionId: string;
  agentId: string;
  containerId: string;
  asciinemaId?: string;
  name?: string;
  startedAt: Date;
}

export class HtManager {
  private docker: Docker;
  private agentRegistry: AgentRegistry;
  private asciinemaServerUrl: string;
  private sessionMetadataPath = '/tmp/ht-sessions/metadata.txt';

  constructor(agentRegistry: AgentRegistry, asciinemaServerUrl: string) {
    this.docker = new Docker();
    this.agentRegistry = agentRegistry;
    this.asciinemaServerUrl = asciinemaServerUrl;
  }

  /**
   * Detect ht instances running in a container by checking for ht processes
   */
  async detectHtInstances(containerId: string): Promise<string[]> {
    try {
      const container = this.docker.getContainer(containerId);
      const exec = await container.exec({
        Cmd: ['sh', '-c', 'ps aux | grep -E "[h]t" | grep -v grep'],
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ hijack: true, stdin: false });
      let output = '';

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          output += chunk.toString();
        });

        stream.on('end', () => {
          // Extract process IDs or session identifiers
          const lines = output.split('\n').filter(line => line.trim());
          const sessionIds = lines.map((line, index) => {
            // Generate a session ID based on process info or use index
            const match = line.match(/\d+/);
            return match ? `ht-${containerId}-${match[0]}` : `ht-${containerId}-${index}`;
          });

          resolve(sessionIds);
        });

        stream.on('error', reject);
      });
    } catch (error) {
      console.error(`Error detecting ht instances in container ${containerId}:`, error);
      return [];
    }
  }

  /**
   * Read session metadata from container
   */
  async readSessionMetadata(containerId: string): Promise<{ agentName?: string; startedAt?: string }> {
    try {
      const container = this.docker.getContainer(containerId);
      const exec = await container.exec({
        Cmd: ['cat', this.sessionMetadataPath],
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ hijack: true, stdin: false });
      let output = '';

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          output += chunk.toString();
        });

        stream.on('end', () => {
          const metadata: { agentName?: string; startedAt?: string } = {};
          const lines = output.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('Agent:')) {
              metadata.agentName = line.split(':')[1]?.trim();
            } else if (line.startsWith('Started:')) {
              metadata.startedAt = line.split(':').slice(1).join(':').trim();
            }
          }

          resolve(metadata);
        });

        stream.on('error', () => {
          // Metadata file might not exist yet
          resolve({});
        });
      });
    } catch (error) {
      console.error(`Error reading session metadata from container ${containerId}:`, error);
      return {};
    }
  }

  /**
   * Check for new terminal sessions in all agent containers
   */
  async scanForNewSessions(): Promise<HtSessionInfo[]> {
    const newSessions: HtSessionInfo[] = [];
    const agents = this.agentRegistry.getAllAgents();

    for (const agent of agents) {
      if (!agent.containerId || agent.status !== 'running') {
        continue;
      }

      try {
        const htInstances = await this.detectHtInstances(agent.containerId);
        const metadata = await this.readSessionMetadata(agent.containerId);

        for (const sessionId of htInstances) {
          // Check if this session is already registered
          const existingSession = agent.terminalSessions.find(s => s.id === sessionId);
          
          if (!existingSession) {
            // New session detected
            const sessionInfo: HtSessionInfo = {
              sessionId,
              agentId: agent.id,
              containerId: agent.containerId,
              name: metadata.agentName ? `${metadata.agentName} session` : undefined,
              startedAt: metadata.startedAt ? new Date(metadata.startedAt) : new Date(),
            };

            // Register with agent registry
            await this.agentRegistry.addTerminalSession(
              agent.id,
              sessionId,
              undefined, // asciinemaId will be set when session is created on asciinema server
              sessionInfo.name
            );

            newSessions.push(sessionInfo);
          }
        }
      } catch (error) {
        console.error(`Error scanning sessions for agent ${agent.id}:`, error);
      }
    }

    return newSessions;
  }

  /**
   * Get asciinema recording ID for a session
   * This would be called when a new session is created on the asciinema server
   */
  async updateSessionAsciinemaId(agentId: string, sessionId: string, asciinemaId: string): Promise<void> {
    await this.agentRegistry.updateTerminalSession(agentId, sessionId, { asciinemaId });
  }

  /**
   * Start continuous scanning for new sessions
   */
  startScanning(intervalMs: number = 5000): void {
    setInterval(async () => {
      try {
        const newSessions = await this.scanForNewSessions();
        if (newSessions.length > 0) {
          console.log(`Detected ${newSessions.length} new terminal session(s)`);
        }
      } catch (error) {
        console.error('Error during session scanning:', error);
      }
    }, intervalMs);
  }
}

