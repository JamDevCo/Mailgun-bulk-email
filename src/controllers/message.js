const { convert } = require("html-to-text");

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
 * Adds recipient variable to list of available recipient variables
 */
const generateRecipientVariables = (recipientVariables, members) => {
  let defaultFields = ["name", "address", "subscribed"];
  for (let member of members) {
    // Create empty object to store recipient variables if none are present
    if (!recipientVariables[member.address]) {
      console.log(recipientVariables[member.address]);
      recipientVariables[member.address] = {};
    }

    // Add existing variables to recipient variables
    console.log("Updating fields from recipient Old");
    console.log(member);
    Object.assign(recipientVariables[member.address], { ...member.vars });

    console.log("new Fields");
    console.log(member);
    // Add default fields
    console.log("Adding default fields");
    for (let field of defaultFields)
      try {
        recipientVariables[member.address][field] = member[field];
      } catch (err) {
        console.log(err);
        continue;
      }
  }

  return recipientVariables;
};

module.exports = { sendMessage, generateRecipientVariables };
