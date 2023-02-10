const { convert } = require("html-to-text");
const { JSDOM } = require("jsdom");

const getImage = (html, fileAttachments, inLineImages) => {
  var images = [];
  let result = html.replace(
    /src=(\"|\')([^\"]*)(\"|\')/g,
    function (match, url) {
      // eslint-disable-line
      var codec, extension;
      console.log("Regex Match");
      console.log(match);
      if (match.indexOf("data:image/png;base64,") != -1) {
        codec = "png";
        extension = ".png";
      } else if (match.indexOf("data:image/jpeg;base64,") != -1) {
        codec = "jpeg";
        extension = ".jpg";
      }

      console.log(codec, extension, match.indexOf("data:image/png;base64,"));
      if (codec) {
        var name = "image" + images.length + extension,
          base64 = match.replace("data:image/" + codec + ";base64,", "");
        buffer = Buffer.from(base64, "base64");
        inLineImages.push({
          contentType: "image/" + codec,
          filename: name,
          data: buffer,
          //   data: buffer,
          cid: name,
          knownLength: buffer.length,
        });
        return `src='${match.replace(match, "cid:" + name)}'`;
      }
      return match;
    }
  );

  return result;
};

const sendMessage = async (
  req,
  res,
  fileAttachments,
  mailgunClient,
  mailingList,
  recipientVariables
) => {
  console.log("Attachments");
  console.log(req.body.message.slice(0, 300));
  let inLineImages = [];
  var html = getImage(req.body.message, fileAttachments, inLineImages);
  // const html = req.body.message;
  // Convert HTML Message to plaintext
  const plaintext = convert(html, {
    wordwrap: 130,
  });

  const dom = new JSDOM(html, { resources: "usable" });
  try {
    console.log(dom.window.document.querySelector("p img").src.slice(0, 400));
  } catch (error) {
    console.log("No Image found");
  }

  const emailData = {
    from: req.body.from_email,
    to: req.body.mailing_list,
    subject: req.body.subject,
    text: plaintext,
    html: html,
    inline: inLineImages,
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
