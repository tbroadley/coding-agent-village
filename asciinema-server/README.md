# Asciinema Server

Self-hosted asciinema server for terminal session recording and streaming.

## Setup

Follow the [official asciinema self-hosting guide](https://docs.asciinema.org/manual/server/self-hosting/) for detailed setup instructions.

## Quick Start

1. Clone the asciinema server repository:
```bash
git clone https://github.com/asciinema/asciinema-server.git .
```

2. Configure environment variables (see `.env.example`)

3. Set up database:
```bash
bundle exec rake db:create db:migrate
```

4. Start the server:
```bash
bundle exec rails server
```

## Integration with ht-mcp

ht-mcp instances in agent containers will stream directly to this server using the asciinema livestream protocol.

## Production

In production, set up a reverse proxy (nginx/traefik) in front of this server for HTTPS and domain routing.

