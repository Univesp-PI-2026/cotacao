FROM caddy:2.11.7-builder-alpine AS builder
RUN xcaddy build v2.11.7 \
    --with github.com/caddy-dns/acmedns@e31051404eb97b5b8c83f68d4d333efc8b31b698

FROM caddy:2.11.7-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
