# Use Debian as the base image
FROM debian:latest

# Install prerequisites
RUN apt-get update && \
    apt-get install -y \
    curl \
    bash \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user without sudo permissions
RUN useradd -m -s /bin/bash claude

# Switch to claude user for installation
USER claude

# Install Claude Code using the official installation script (as claude user)
RUN curl -fsSL https://claude.ai/install.sh | bash

# Set working directory
WORKDIR /app

RUN mkdir .claude && echo '{"apiKeyHelper": "echo $CODING_AGENT_VILLAGE_ANTHROPIC_API_KEY"}' > .claude/settings.json

RUN curl -L https://github.com/memextech/ht-mcp/releases/latest/download/ht-mcp-x86_64-unknown-linux-gnu -o ht-mcp \
    && mv ht-mcp /home/claude/.local/bin \
    && chmod +x /home/claude/.local/bin/ht-mcp

# Set up environment to ensure Claude Code is in PATH
# The install script typically installs to ~/.local/bin or /usr/local/bin
ENV PATH="${PATH}:/home/claude/.local/bin:/usr/local/bin"

RUN claude mcp add --transport stdio ht-mcp ht-mcp

# Run Claude Code as the main process
ENTRYPOINT ["claude"]

