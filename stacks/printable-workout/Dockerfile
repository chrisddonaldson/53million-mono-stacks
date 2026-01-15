# Build static bundle assumed prebuilt in repo (run `cd workout-renderer && npm run build` first)
FROM nginx:alpine

# Replace default config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
WORKDIR /usr/share/nginx/html
COPY index.html ./
COPY media ./media
COPY workout-renderer/dist ./workout-renderer/dist

# Minimal health indicator
HEALTHCHECK CMD wget -qO- http://localhost:80/ || exit 1
