# Fase di build dell'app React
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install && npm install typescript -D
COPY . .
RUN npm run build

# Fase finale: copia la build in una cartella separata per condivisione con NGINX
RUN mkdir -p /app/dist && cp -r dist/* /app/dist

# Container definitivo che resta in attesa (non serve per servire direttamente)
CMD ["sh", "-c", "npm run build && cp -r dist/* /app/dist && tail -f /dev/null"]