# Frontend SignLight (Next.js standalone).
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Next.js cần biến công khai ngay lúc BUILD — chỉ nhận biến KHÔNG nhạy cảm.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CDN_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_CDN_BASE_URL=$NEXT_PUBLIC_CDN_BASE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
# HOSTNAME=0.0.0.0: Next.js standalone mặc định bind theo $HOSTNAME (là id container), khiến
# healthcheck gọi localhost bên trong container không tới được.
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
RUN addgroup -S nodejs && adduser -S -G nodejs nextjs && apk add --no-cache wget
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
