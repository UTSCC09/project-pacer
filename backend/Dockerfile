FROM node:16.15-alpine as build

RUN mkdir -p /app

WORKDIR /app

COPY package*.json ./

RUN yarn install --non-interactive --ignore-optional

COPY server.key /etc/ssl/private/backend-selfsigned.key

COPY server.crt /etc/ssl/certs/backend-selfsigned.crt

COPY . .

CMD [ "node", "app.js" ]