FROM node:carbon

# Create app directory
WORKDIR /usr/src/app

# Copy over package.json (and package-lock.json, if applicable)
COPY package*.json yarn.lock ./

# Install app dependencies
RUN yarn install

# Bundle app source
COPY . .

# Build app source
RUN yarn prod

EXPOSE 9090
CMD [ "yarn", "start" ]