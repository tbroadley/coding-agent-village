import Docker from 'dockerode';

export interface Agent {
  id: string;
  name: string;
  type: 'claude' | 'codex';
  containerId?: string;
  status: 'running' | 'stopped' | 'starting' | 'error';
  startedAt?: Date;
  terminalSessions: TerminalSession[];
}

export interface TerminalSession {
  id: string;
  agentId: string;
  name?: string;
  asciinemaId?: string;
  startedAt: Date;
  status: 'active' | 'completed';
}

export class AgentRegistry {
  private agents: Map<string, Agent> = new Map();
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async registerAgent(name: string, type: 'claude' | 'codex', containerId?: string): Promise<Agent> {
    const agent: Agent = {
      id: `${type}-${name}`,
      name,
      type,
      containerId,
      status: containerId ? 'running' : 'stopped',
      startedAt: new Date(),
      terminalSessions: [],
    };

    this.agents.set(agent.id, agent);
    return agent;
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  async updateAgentStatus(agentId: string, status: Agent['status']): Promise<void> {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      if (status === 'running' && !agent.startedAt) {
        agent.startedAt = new Date();
      }
    }
  }

  async addTerminalSession(agentId: string, sessionId: string, asciinemaId?: string, name?: string): Promise<TerminalSession> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const session: TerminalSession = {
      id: sessionId,
      agentId,
      name,
      asciinemaId,
      startedAt: new Date(),
      status: 'active',
    };

    agent.terminalSessions.push(session);
    return session;
  }

  async updateTerminalSession(agentId: string, sessionId: string, updates: Partial<TerminalSession>): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const session = agent.terminalSessions.find(s => s.id === sessionId);
    if (session) {
      Object.assign(session, updates);
    }
  }

  async getTerminalSessions(agentId: string): Promise<TerminalSession[]> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return agent.terminalSessions.filter(s => s.status === 'active');
  }

  async detectHtInstances(containerId: string): Promise<string[]> {
    try {
      const container = this.docker.getContainer(containerId);
      const exec = await container.exec({
        Cmd: ['ps', 'aux'],
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
          // Parse output to find ht processes
          const lines = output.split('\n');
          const htProcesses = lines
            .filter(line => line.includes('ht') || line.includes('/tmp/ht-sessions'))
            .map(line => {
              // Extract process info or session ID
              const match = line.match(/(\S+)/);
              return match ? match[1] : null;
            })
            .filter(Boolean) as string[];

          resolve(htProcesses);
        });

        stream.on('error', reject);
      });
    } catch (error) {
      console.error(`Error detecting ht instances in container ${containerId}:`, error);
      return [];
    }
  }

  async pollAgentContainers(): Promise<void> {
    try {
      const containers = await this.docker.listContainers({ all: true });
      
      for (const containerInfo of containers) {
        const labels = containerInfo.Labels || {};
        const agentName = labels['agent.name'];
        const agentType = labels['agent.type'] as 'claude' | 'codex' | undefined;

        if (agentName && agentType) {
          const agentId = `${agentType}-${agentName}`;
          let agent = this.agents.get(agentId);

          if (!agent) {
            agent = await this.registerAgent(agentName, agentType, containerInfo.Id);
          } else {
            agent.containerId = containerInfo.Id;
            agent.status = containerInfo.State === 'running' ? 'running' : 'stopped';
          }

          // Detect ht instances if container is running
          if (containerInfo.State === 'running') {
            const htInstances = await this.detectHtInstances(containerInfo.Id);
            // Update terminal sessions based on detected instances
            // This is a simplified version - in production, you'd want more sophisticated detection
          }
        }
      }
    } catch (error) {
      console.error('Error polling agent containers:', error);
    }
  }

  startPolling(intervalMs: number = 5000): void {
    setInterval(() => {
      this.pollAgentContainers().catch(console.error);
    }, intervalMs);
  }
}

