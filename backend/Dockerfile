FROM node:18

WORKDIR /app

# Copia e installa le dipendenze
COPY package*.json ./
RUN npm install

# Copia il resto del codice, incluso prisma + sorgente TS
COPY prisma ./prisma/
COPY . .

# Genera Prisma Client
RUN npx prisma generate

# 🔧 Compila il TypeScript!
RUN npm run build

# Espone la porta
EXPOSE 4000

# Avvia l'app compilata
CMD ["npm", "run", "start"]