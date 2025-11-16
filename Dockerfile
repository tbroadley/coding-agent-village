# Use Debian as the base image
FROM debian:latest

# Install prerequisites including Rust build dependencies
RUN apt-get update && \
    apt-get install -y \
    bash \
    build-essential \
    ca-certificates \
    curl \
    git \
    libssl-dev \
    pkg-config \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user without sudo permissions
RUN useradd -m -s /bin/bash claude

# Switch to claude user for installation
USER claude

# Install Rust toolchain using rustup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="${PATH}:/home/claude/.cargo/bin"

# Install asciinema 3.0 from source
RUN cargo install --locked --git https://github.com/asciinema/asciinema

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
