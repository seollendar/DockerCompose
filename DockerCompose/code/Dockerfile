FROM node:latest
RUN mkdir -p /usr/src/node
WORKDIR /usr/src/node
COPY package.json /usr/src/node/
RUN npm install
COPY . /usr/src/node
EXPOSE 7980
CMD node kafkaEmulatorProducer.js
