# Stage 1: build the Vite app
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY pulse-frontend/package*.json ./
RUN npm ci

# Copy source code
COPY pulse-frontend ./

# Allow overriding the API base URL at build time
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build

# Stage 2: serve the compiled app with nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
