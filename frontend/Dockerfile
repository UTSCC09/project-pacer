FROM node:16.15-alpine as build

# send signal to containers to stop them
STOPSIGNAL SIGTERM

RUN mkdir -p /app

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package*.json ./

RUN yarn cache clean
# will execute npm install in /home/app because of WORKDIR
RUN yarn install --non-interactive --ignore-optional --network-timeout 1000000

COPY . ./
RUN PUBLIC_URL=/ yarn run build

FROM nginx:1.21.0-alpine as app

RUN apk add --no-cache bash

FROM ubuntu:20.04

RUN apt-get update \
    && apt-get install -y nginx openssl \
    && openssl req \
      -x509 \
      -subj "/C=CA/ST=ON/L=Toronto/O=Pacer/CN=pacer.codes" \
      -nodes \
      -days 365 \
      -newkey rsa:2048 \
      -keyout /etc/ssl/private/nginx-selfsigned.key \
      -out /etc/ssl/certs/nginx-selfsigned.crt

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/nginx/nginxconfig/general.conf /etc/nginx/general.conf
COPY --from=build /app/nginx/nginxconfig/security.conf /etc/nginx/security.conf
COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/.env /usr/share/nginx/html/.env

EXPOSE 80 443
CMD ["/bin/bash", "-c", "nginx -g \"daemon off;\""]