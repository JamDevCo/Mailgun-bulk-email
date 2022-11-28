const { initializeMailgunClient } = require("../util/initializeClient");

const createMailingList = async (req, res) => {
  const client = initializeMailgunClient(req.body.apiKey);
  const listAddress = `${req.body.name}@${req.body.domain}`;

  let newList = [];
  try {
    newList = await client.lists.create({
      address: listAddress,
      name: req.body.name,
      description: req.body.description,
      access_level: req.body.accessLevel, // readonly (default), members, everyone
    });
    console.log("newList", newList);
    res.status(200).send({ status: "Success", data: newList });
  } catch (error) {
    console.error(error);
    res.status(400).send(error);
  }
};

const getMailingLists = async (req, res) => {
  let mailingList = [];
  let mailingOptions = "";
  console.log(req.body);

  const client = initializeMailgunClient(req.body.apiKey);

  // Pull mailing list from mailgun
  let list = {};
  try {
    list = await client.lists.list();
  } catch (error) {
    res.status(400).send({ error: error });
  }

  // If no list items render error
  if (!list.items) {
    res.render("mailgun", {
      error: list.message,
    });
  }

  // Render html element for each mailing list
  for (let item of list.items) {
    mailingList.push({ name: item.name, email: item.address });
    mailingOptions += `<option value="${item.address}">${item.address}</option>`;
  }

  return { mailing_list: mailingList, mailing_options: mailingOptions };
};

module.exports = { createMailingList, getMailingLists };