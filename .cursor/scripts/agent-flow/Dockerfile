# agent-flow — multi-agent orchestration server
#
# The @cursor/sdk local runtime is fully bundled in the npm package
# (dist/esm/index.js ships the agent runtime; platform packages
# @cursor/sdk-linux-* provide the ripgrep + sandbox helper binaries).
# No separate cursor-agent CLI install is required — `npm ci` inside a
# linux container pulls @cursor/sdk-linux-x64/arm64 automatically.
FROM node:22-slim

# git: agents commonly run git in the target project.
# ca-certificates + curl: SDK API calls / healthchecks.
# python3 + build tools are NOT needed: sqlite3 ships prebuilt binaries
# for linux x64/arm64 glibc.
RUN apt-get update \
  && apt-get install -y --no-install-recommends git ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY src ./src
COPY migrations ./migrations
COPY public ./public

# The SDK stores local agent state under ~/.cursor — persist it via a volume
# (declared in docker-compose.yml). Run as the non-root node user.
RUN mkdir -p /home/node/.cursor /workspace && chown -R node:node /home/node /app /workspace
USER node
ENV HOME=/home/node

ENV PORT=3900
EXPOSE 3900

CMD ["node", "src/server.mjs"]
