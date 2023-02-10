const { convert } = require("html-to-text");
const { JSDOM } = require("jsdom");
const HTMLParser = require('node-html-parser');


const signatures = {
  JVBERi0: "application/pdf",
  R0lGODdh: "image/gif",
  R0lGODlh: "image/gif",
  iVBORw0KGgo: "image/png",
  "/9j/": "image/jpg"
};

const detectMimeType = function (b64) {
  for (var s in signatures) {
    if (b64.indexOf(s) === 0) {
      return signatures[s];
    }
  }
}

const parseAttachment = (html, fileAttachments, inLineImages) => {
  var images = [];

  var html_parsed = HTMLParser.parse(html);
  var images = html_parsed.querySelectorAll('img');
  for (let index = 0; index < images.length; index++) {
    const img = images[index];
    var codec, extension;
    var image_src = img.getAttribute('src');

    if (image_src.toLowerCase().indexOf("data:image/png;base64,") != -1) {
      codec = "png";
      extension = ".png";
    } else if (image_src.toLowerCase().indexOf("data:image/jpeg;base64,") != -1) {
      codec = "jpeg";
      extension = ".jpg";
    } else if (image_src.toLowerCase().indexOf("data:image/webp;base64,") != -1) {
      codec = "webp";
      extension = ".webp";
    } else if (image_src.toLowerCase().indexOf("data:image/gif;base64,") != -1) {
      codec = "gif";
      extension = ".gif";
    }

    if (codec) {
      var name = "image" + index + extension,
        base64 = image_src.replace("data:image/" + codec + ";base64,", "");
      var buffer = Buffer.from(base64, "base64");
      inLineImages.push({
        contentType: "image/" + codec,
        filename: name,
        data: buffer,
        //   data: buffer,
        cid: name,
        knownLength: buffer.length,
      });
      // return `src='${match.replace(match, "cid:" + name)}'`;
      img.setAttribute('src', "cid:" + name);
    }
    
  }
  let result = html_parsed.toString();
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
  // console.log(req.body.message.slice(0, 300));
  let inLineImages = [];
  var html = parseAttachment(req.body.message, fileAttachments, inLineImages);
  // const html = req.body.message;
  // Convert HTML Message to plaintext
  console.log(html);
  const plaintext = convert(html, {
    wordwrap: 130,
  });

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
    // console.log(result);
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
