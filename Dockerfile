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

# Set up environment to ensure Claude Code is in PATH
# The install script typically installs to ~/.local/bin or /usr/local/bin
ENV PATH="${PATH}:/home/claude/.local/bin:/usr/local/bin"

RUN mkdir .claude && echo '{"apiKeyHelper": "echo $CODING_AGENT_VILLAGE_ANTHROPIC_API_KEY"}' > .claude/settings.json

# Run Claude Code as the main process
ENTRYPOINT ["claude"]

