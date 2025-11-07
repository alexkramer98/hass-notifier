FROM imbios/bun-node:1.3.1-24-alpine
COPY package.json bun.lock index.js .env ./
RUN bun install --immutable
CMD ["bun", "run", "start"]
