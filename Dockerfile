FROM node:20
WORKDIR /data
COPY package.json yarn.lock index.js .env ./
RUN yarn install --immutable
COPY . .
CMD ["yarn", "start"]
