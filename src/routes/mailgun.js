/** Express router providing mailgun related routes
 * @module routers/users
 * @requires express
 * @requires fs
 */

const express = require("express");
const { convert } = require("html-to-text");
const path = require("path");
const fsPromises = require("fs").promises;

const uploadDir = path.join(__dirname, "uploads");

/**
 * Express router to mount mailgun related functions on.
 * @type {object}
 * @const
 * @namespace mailgunRouter
 */
const router = express.Router();

const { initializeMailgunClient } = require("../util/initializeClient");

// Declare functions
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

const getMembers = async (req, res) => {
  const client = initializeMailgunClient(req.body.apiKey);
  try {
    const members = await client.lists.members.listMembers(
      req.body.mailing_list
    );
    return members;
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: error });
  }
};

const addRecipientField = (fieldName, member) => {};

/**
 * Adds recipient variable to list of available recipient variables
 */
const addRecipientVariable = (recipientVariables, field, members) => {
  //console.log(members);
  for (let member of members) {
    // Attempt to set recipient variable if recipient has the field
    console.log(member);
    recipientVariables[member.address] = {};
    try {
      recipientVariables[member.address][field] = member[field];
    } catch (err) {
      console.log(err);
      continue;
    }
  }
};

const addMembers = async (req, res) => {
  const client = initializeMailgunClient(req.body.apiKey);
  try {
    const members = await client.lists.members.createMembers(req.body.address, {
      members: req.body.members,
      upsert: "yes",
    });

    return members;
  } catch (error) {
    res.status(400).send({ status: "Error", error: error });
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

const attachFile = async (uploadDir, attachment, fileAttachments) => {
  // Uploads file to server
  let uploadPath = path.join(uploadDir, attachment.name);

  // Move the file somewhere onto your server
  attachment.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    console.log(`${attachment.name} File uploaded!`);
  });

  // Prepare file for mailgun
  const file = {
    filename: attachment.name,
    data: await fsPromises.readFile(uploadPath),
  };

  fileAttachments.push(file);
};
const attachFiles = async (req, res, fileAttachments, uploadDir) => {
  // Check for attachment

  if (req.files) {
    if (Array.isArray(req.files.file)) {
      for (let attachment of req.files.file) {
        if (!attachment) {
          continue;
        }
        attachFile(uploadDir, attachment, fileAttachments);
      }
    } else {
      attachFile(uploadDir, attachment, fileAttachments);
    }
  }
};

const sendMessage = async (
  req,
  res,
  fileAttachments,
  mailgunClient,
  mailingList,
  recipientVariables
) => {
  // Convert HTML Message to plaintext
  const plaintext = convert(req.body.message, {
    wordwrap: 130,
  });

  const emailData = {
    from: req.body.from_email,
    to: req.body.mailing_list,
    subject: req.body.subject,
    text: plaintext,
    html: req.body.message,
    "recipient-variables": JSON.stringify(recipientVariables),
  };

  if (fileAttachments.length >= 0) {
    emailData.attachment = fileAttachments;
  }

  // Attempt to send email
  try {
    const result = await mailgunClient.messages.create(
      req.body.domain,
      emailData
    );
    console.log("Email sent");
    console.log(result);
    res.render("message", {
      apiKey: req.body.apiKey,
      domain: req.body.domain,
      req_data: req.body,
      mailing_list: mailingList.mailing_list,
      mailing_options: mailingList.mailing_options,
      msg: "Message successfully sent.",
      err: false,
    });
  } catch (err) {
    res.render("message", {
      apiKey: req.body.apiKey,
      domain: req.body.domain,
      req_data: req.body,
      mailing_list: mailingList.mailing_list,
      mailing_options: mailingList.mailing_options,
      msg: "Error. Something went wrong.",
      err: true,
    });
  }
};
/**
 * Route to create mailing list with members
 * @name post/list/create
 * @function
 * @memberof module:routers/mailgun~mailgunRouter
 * @param {string} apiKey The mailgun api key
 * @param {string} domain The mailgun domain (e.g example.com)
 * @param {string} name The name of the mailing list
 * @param {string} description
 * @param {string} accessLevel
 * @param {string[]} members The members to be added to the list
 */
router.post("/list/create", async (req, res) => {
  createMailingList(req, res);
});

router.post("/list/add-members", async (req, res) => {
  const members = addMembers(req, res);
  res.status(201).send({ status: "Success", data: { ...members } });
});

router.delete("/list/delete", async (req, res) => {
  const client = initializeMailgunClient(req.body.apiKey);
  try {
    const result = await client.lists.destroy(req.body.mailing_list_address);
    res.status(200).send({
      status: "Success",
      data: result,
    });
  } catch (err) {
    res.status(400).send({ status: "Error", error: err });
  }
});

/**
 * Route serving mailing list.
 * @name get/list
 * @function
 * @memberof module:routers/mailgun~mailgunRouter
 * @param {string} apiKey The mailgun api key
 * @param {string} domain The mailgun domain (e.g example.com)
 */
router.post("/list", async (req, res) => {
  const result = await getMailingLists(req, res);
  res.render("message", {
    apiKey: req.body.apiKey,
    domain: req.body.domain,
    req_data: req.body,
    mailing_list: result.mailing_list,
    mailing_options: result.mailing_options,
    msg: "Send Custom Message to Mailing List.",
    err: false,
  });
});

router.get("/list/members", async (req, res) => {
  const members = await getMembers(req, res);
  res.status(200).send({ data: members });
});
router.post("/message", async (req, res) => {
  const client = initializeMailgunClient(req.body.apiKey);
  const mailingList = await getMailingLists(req, res);

  let fileAttachments = [];
  attachFiles(req, res, fileAttachments, uploadDir);

  // Generate Recipient Variables
  const members = await getMembers(req, res);
  const recipientVariableFields = req.body.recipient_variables;
  const recipientVariables = {};

  // Add recipient variables
  for (let field of recipientVariableFields) {
    addRecipientVariable(recipientVariables, field, members.items);
  }
  // res.status(200).send({ data: members, vars: recipientVariables });
  sendMessage(
    req,
    res,
    fileAttachments,
    client,
    mailingList,
    recipientVariables
  );
  // console.log(plaintext);

  // res.status(200).send({ list: mailingList, message: req.body.message });
});

module.exports = router;
