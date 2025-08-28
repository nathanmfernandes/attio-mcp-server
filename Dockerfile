# Dockerfile (in your fork's root)
FROM node:20-alpine

# Required Alpine packages (Bun needs libc6-compat on Alpine)
RUN apk add --no-cache curl bash git libc6-compat

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Install MCP HTTP/SSE bridge and axios
RUN npm install -g mcp-proxy axios

# Copy your modified server code into the image
WORKDIR /srv/app
COPY . /srv/app

# Install deps
RUN bun install

# Try to build if a build script exists; otherwise it’s fine
RUN (bun run build || echo "No build script; continuing")

# Robust launcher: prefer compiled JS, fallback to TS
RUN printf '%s\n' \
  '#!/bin/sh' \
  'set -e' \
  'APP_DIR="/srv/app"' \
  'if [ -f "$APP_DIR/dist/index.js" ]; then' \
  '  exec node "$APP_DIR/dist/index.js"' \
  'fi' \
  'if [ -f "$APP_DIR/src/index.ts" ]; then' \
  '  exec bun "$APP_DIR/src/index.ts"' \
  'fi' \
  'echo "ERROR: Could not find Attio MCP entrypoint (dist/index.js or src/index.ts)!" >&2' \
  'exit 1' \
  > /usr/local/bin/run-attio && chmod +x /usr/local/bin/run-attio

# Env – set ATTIO_ACCESS_TOKEN at runtime
ENV PORT=3000 \
    LOG_LEVEL=info

EXPOSE 8080

# Expose MCP over HTTP at /mcp (stateless)
CMD ["mcp-proxy","--host","0.0.0.0","--port","8080","--stateless","/usr/local/bin/run-attio"]
