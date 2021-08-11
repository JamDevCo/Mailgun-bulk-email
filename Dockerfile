FROM node:12.18

# Create app directory
WORKDIR /usr/src/app
COPY . .

RUN npm install
RUN mkdir -p /usr/src/app/uploads

EXPOSE 19081

CMD [ "npm", "start"]