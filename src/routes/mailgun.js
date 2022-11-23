/** Express router providing mailgun related routes
 * @module routers/users
 * @requires express
 */

const express = require("express");

/**
 * Express router to mount mailgun related functions on.
 * @type {object}
 * @const
 * @namespace mailgunRouter
 */
const router = express.Router();

const { initializeMailgunClient } = require("../util/initializeClient");

router.get("/", (req, res) => {
  res.send("mailunrouter works").status(200);
});

router.post("/list/create", (req, res) => {});

/**
 * Route serving mailing list.
 * @name get/list
 * @function
 * @memberof module:routers/mailgun~mailgunRouter
 * @param {string} apiKey The mailgun api key
 * @param {string} domain The mailgun domain (e.g example.com)
 */
router.get("/list", async (req, res) => {
  let mailingList = [];
  let mailingOptions = "";
  const client = initializeMailgunClient(req.body.apiKey);

  // Pull mailing list from mailgun
  const list = await client.lists
    .list()
    .then((data) => {
      console.log(data);
      return data;
    })
    .catch((err) => console.error(err));

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

  // Render data to page
  res.render("message", {
    apiKey: req.body.apiKey,
    domain: req.body.domain,
    req_data: req.body,
    mailing_list: mailingList,
    mailing_options: mailingOptions,
    msg: "Send Custom Message to Mailing List.",
    err: false,
  });
});

module.exports = router;
