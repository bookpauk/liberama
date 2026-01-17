# build
FROM node:19 AS build
WORKDIR /build
COPY . .
RUN apt-get update -y && apt-get install -y zip 
RUN npm i 
RUN npm run build:linux 

# runtime
FROM nginx:1.22
WORKDIR /app

COPY --from=build /build/dist/linux/* /app/
COPY docker/liberama.conf /etc/nginx/conf.d/default.conf
COPY docker/40-start-liberama.sh /docker-entrypoint.d/

RUN chmod a+x /docker-entrypoint.d/40-start-liberama.sh
