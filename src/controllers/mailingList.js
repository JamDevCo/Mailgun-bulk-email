const { initializeMailgunClient } = require("../util/initializeClient");
const { getMembers, getAllMembers } = require("./members");

const { parse } = require("csv-parse/sync");
const json2csv = require("json2csv");
const { slugify } = require("../util/stringUtil");
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
  let apiKey = undefined;
  console.log(req.body);
  console.log(`Session is`);
  console.log(req.session);

  if (!req.session.apiKey) {
    apiKey = req.body.apiKey;
  } else {
    apiKey = req.session.apiKey;
  }
  const client = initializeMailgunClient(apiKey);

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

const downloadMailingList = async (req, res) => {
  const email = req.query.email || "";

  // Get mailing list members
  const members = await getAllMembers(req, res, email);
  // console.log(members);
  // const fields = ["address", "name", "subscribed"];
  // const data = json2csv.parse(members.items, { fields });

  const fields = ["address", "name", "subscribed"];
  const data = json2csv.parse(members, { fields });

  res.attachment(`${slugify(email)}.csv`);
  res.status(200).send(data);
};
module.exports = { createMailingList, getMailingLists, downloadMailingList };
