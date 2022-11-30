const formData = require("form-data");
const Mailgun = require("mailgun.js");

/** Initializes Mailgun Client with API Key*/
const initializeMailgunClient = (apiKey) => {
  const mailgun = new Mailgun(formData);
  const client = mailgun.client({
    username: "api",
    key: apiKey,
  });

  return client;
};

module.exports = { initializeMailgunClient };
