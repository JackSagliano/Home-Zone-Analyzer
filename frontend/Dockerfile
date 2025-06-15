# Stage 1: Build stage
FROM node:latest as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

# Stage 2: Serve stage
FROM nginx:alpine

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copia la configurazione di Nginx personalizzata
COPY nginx.conf /etc/nginx/conf.d/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]



