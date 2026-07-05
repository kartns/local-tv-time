# ---- Stage 1: Build ----
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create a template database with the correct schema
ENV DATABASE_URL=file:./template.db
RUN npx prisma db push --accept-data-loss

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copy the template database
COPY --from=builder /app/template.db ./template.db

# Create data directory for SQLite
RUN mkdir -p /app/prisma/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# At startup: if no database exists, copy template; then start server
CMD ["sh", "-c", "if [ ! -f /app/prisma/data/tvtime.db ]; then cp /app/template.db /app/prisma/data/tvtime.db; echo 'Created fresh database'; fi && node server.js"]
