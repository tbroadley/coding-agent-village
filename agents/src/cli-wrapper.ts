import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Wrapper for invoking Claude Code CLI programmatically
 * Claude Code CLI can be invoked via the 'claude' command after installation
 */
export class ClaudeCodeCLI {
  private workspacePath: string;

  constructor(workspacePath: string = '/workspace') {
    this.workspacePath = workspacePath;
  }

  /**
   * Execute a command using Claude Code CLI
   * Note: Claude Code CLI may require interactive authentication
   */
  async execute(prompt: string, options: { context?: string } = {}): Promise<string> {
    // Claude Code CLI usage: claude <prompt>
    // This is a simplified wrapper - actual CLI may have different interface
    const command = `cd ${this.workspacePath} && claude "${prompt}"`;
    const { stdout, stderr } = await execAsync(command, {
      env: { ...process.env },
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });

    if (stderr && !stderr.includes('warning')) {
      throw new Error(stderr);
    }

    return stdout;
  }
}

/**
 * Wrapper for invoking Codex CLI programmatically
 * Codex CLI can be invoked via the 'codex' command after installation
 */
export class CodexCLI {
  private workspacePath: string;

  constructor(workspacePath: string = '/workspace') {
    this.workspacePath = workspacePath;
  }

  /**
   * Execute a command using Codex CLI
   * Codex CLI provides an interactive terminal UI, but we can use it programmatically
   */
  async execute(prompt: string, options: { context?: string } = {}): Promise<string> {
    // Codex CLI usage: codex <command>
    // Note: Codex CLI is primarily interactive, so this may have limitations
    const command = `cd ${this.workspacePath} && echo "${prompt}" | codex`;
    const { stdout, stderr } = await execAsync(command, {
      env: { ...process.env },
      maxBuffer: 10 * 1024 * 1024,
    });

    if (stderr && !stderr.includes('warning')) {
      throw new Error(stderr);
    }

    return stdout;
  }
}

