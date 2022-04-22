FROM node:lts-alpine3.14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

RUN npm install

# Bundle app source
COPY index.js ./
COPY utils.js ./
COPY consts.js ./

EXPOSE 3003
CMD [ "node", "index.js", "3003", "/tmp/verifier-leveldb", "web-explorer.stagenet.tolar.io" ]
