FROM node:20
COPY package.json yarn.lock index.js .env ./
RUN yarn install --immutable
CMD ["yarn", "start"]
