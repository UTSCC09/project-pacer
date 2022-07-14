FROM node:16.15-alpine as build

RUN mkdir -p /app

WORKDIR /app

COPY package*.json ./

RUN yarn install --non-interactive --ignore-optional

COPY . .

CMD [ "node", "app.js" ]