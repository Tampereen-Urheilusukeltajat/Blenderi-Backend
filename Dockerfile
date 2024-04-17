FROM node:20-alpine as build

ENV NODE_ENV production

WORKDIR /server
COPY package*.json .

RUN npm ci

COPY . .

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "start" ]
