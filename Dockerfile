# Stage 1: Build the application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package catalogs
COPY package.json package-lock.json ./

# Install all dependencies (including react-is peer dependency)
RUN npm ci

# Copy workspace source files
COPY . .

# Compile application into optimized static assets
RUN npm run build

# Stage 2: Serve using lightweight, high-performance Alpine Nginx
FROM nginx:stable-alpine

# Copy compiled assets from Stage 1 into Nginx default root directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose HTTP port 80
EXPOSE 80

# Start Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
