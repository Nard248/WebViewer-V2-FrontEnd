# Simple React Dockerfile that just works
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --force
COPY . .
RUN npm run build || npx vite build --mode production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Simple nginx config for React Router (no proxy needed)
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]