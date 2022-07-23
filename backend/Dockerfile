FROM node:16.15-alpine as build

RUN mkdir -p /app

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY server.key /etc/ssl/private/backend-selfsigned.key

COPY server.crt /etc/ssl/certs/backend-selfsigned.crt

COPY . .

EXPOSE 3000
CMD [ "node", "app.js" ]