FROM node:12-alpine


#install CLI mariadb/mysql client
#RUN apk add --update mariadb-client && apk add python3 && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /usr/src

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source & config files for TypeORM & TypeScript
COPY ./src /usr/src

RUN npm run start
