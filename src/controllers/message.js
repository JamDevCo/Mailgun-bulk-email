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

module.exports = { sendMessage };
