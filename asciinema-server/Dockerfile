# Asciinema server Dockerfile
# Based on asciinema's self-hosting documentation

FROM ruby:3.2-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    nodejs \
    npm \
    git \
    tzdata

WORKDIR /app

# Clone asciinema server (or copy from local)
# For now, we'll set up a basic structure
# In production, you'd clone the official asciinema server repo
RUN git clone https://github.com/asciinema/asciinema-server.git . || echo "Repository will be mounted"

# Install Ruby dependencies
RUN bundle install --without development test

# Set up database
RUN bundle exec rake db:create db:migrate

# Expose port
EXPOSE 3000

# Start server
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]

