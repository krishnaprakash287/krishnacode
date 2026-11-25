FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
CMD ["npm", "start"]
