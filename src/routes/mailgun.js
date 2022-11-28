/** Express router providing mailgun related routes
 * @module routers/users
 * @requires express
 * @requires fs
 */

const express = require("express");

const path = require("path");
const uploadDir = path.join(__dirname, "uploads");

// Module Imports
const { initializeMailgunClient } = require("../util/initializeClient");
const {
  createMailingList,
  getMailingLists,
} = require("../controllers/mailingList");

const { getMembers, addMembers } = require("../controllers/members");

const { attachFiles } = require("../controllers/attachments");

const { sendMessage } = require("../controllers/message");

/**
 * Express router to mount mailgun related functions on.
 * @type {object}
 * @const
 * @namespace mailgunRouter
 */
const router = express.Router();

/**
 * Adds recipient variable to list of available recipient variables
 */
const addRecipientVariable = (recipientVariables, field, members) => {
  // console.log(recipientVariables);
  for (let member of members) {
    // Attempt to set recipient variable if recipient has the field
    // console.log(member);
    // console.log(field);
    if (!recipientVariables[member.address]) {
      console.log(recipientVariables[member.address]);
      recipientVariables[member.address] = {};
    }

    try {
      console.log(recipientVariables[member.address][field]);
      recipientVariables[member.address][field] = member[field];
    } catch (err) {
      console.log(err);
      continue;
    }
  }
};

// const sendMessage = async (
//   req,
//   res,
//   fileAttachments,
//   mailgunClient,
//   mailingList,
//   recipientVariables
// ) => {
//   // Convert HTML Message to plaintext
//   const plaintext = convert(req.body.message, {
//     wordwrap: 130,
//   });

//   const emailData = {
//     from: req.body.from_email,
//     to: req.body.mailing_list,
//     subject: req.body.subject,
//     text: plaintext,
//     html: req.body.message,
//     "recipient-variables": JSON.stringify(recipientVariables),
//   };

//   if (fileAttachments.length >= 0) {
//     emailData.attachment = fileAttachments;
//   }

//   // Attempt to send email
//   try {
//     const result = await mailgunClient.messages.create(
//       req.body.domain,
//       emailData
//     );
//     console.log("Email sent");
//     console.log(result);
//     res.render("message", {
//       apiKey: req.body.apiKey,
//       domain: req.body.domain,
//       req_data: req.body,
//       mailing_list: mailingList.mailing_list,
//       mailing_options: mailingList.mailing_options,
//       msg: "Message successfully sent.",
//       err: false,
//     });
//   } catch (err) {
//     res.render("message", {
//       apiKey: req.body.apiKey,
//       domain: req.body.domain,
//       req_data: req.body,
//       mailing_list: mailingList.mailing_list,
//       mailing_options: mailingList.mailing_options,
//       msg: "Error. Something went wrong.",
//       err: true,
//     });
//   }
// };
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
  const defaultVariables = ["name", "address", "subscribed"];

  // Add new recipient variables alongside defaults
  const recipientVariableFields = [
    ...defaultVariables,
    ...req.body.recipient_variables,
  ];

  // console.log(recipientVariableFields);
  const recipientVariables = {};

  // Add recipient variables
  for (let field of recipientVariableFields) {
    // console.log(field);
    addRecipientVariable(recipientVariables, field, members.items);
  }

  sendMessage(
    req,
    res,
    fileAttachments,
    client,
    mailingList,
    recipientVariables
  );

  res.status(200).send({ message: req.body.message });
});

module.exports = router;
