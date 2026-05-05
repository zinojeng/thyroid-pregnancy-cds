# syntax=docker/dockerfile:1
# Multi-stage Dockerfile for Next.js 15 standalone output.
# Bypasses Zeabur's auto-builder (which has a broken `npm update -g npm` step).

# ---- 1. Install deps ----
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---- 2. Build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- 3. Runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user (security best practice)
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone server output (includes minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets that aren't bundled into standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Skill knowledge files are loaded via fs.readFileSync at runtime
# (lib/knowledge.ts → path.join(process.cwd(), 'skill', ...))
COPY --from=builder --chown=nextjs:nodejs /app/skill ./skill

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
