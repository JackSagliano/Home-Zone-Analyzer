# Usa l'immagine ufficiale di Node.js come base
FROM node:16-alpine

# Imposta la directory di lavoro all'interno del container
WORKDIR /usr/src/server

# Copia i file package.json e package-lock.json nella directory di lavoro
COPY package*.json ./

# Installa le dipendenze del progetto
RUN npm install

# Copia tutto il contenuto della cartella del backend nella directory di lavoro del container
COPY . .

# Esponi la porta su cui l'applicazione Node.js sarà in ascolto
EXPOSE 3000

# Comando per avviare l'applicazione
CMD ["node", "server.js"]
