# Use an official Node.js runtime as a base image
FROM node:20

# Set the working directory inside the container
WORKDIR /data

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install --immutable

# Copy the rest of the application code to the working directory
COPY . .

CMD ["yarn", "start"]
