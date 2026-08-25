FROM node:24-alpine AS builder

WORKDIR /app

RUN npm install --global pnpm@11.19.0

ENV PNPM_CONFIG_FETCH_TIMEOUT=600000 \
    PNPM_CONFIG_FETCH_RETRIES=5
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=superstaff-pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
