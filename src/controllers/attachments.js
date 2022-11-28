const path = require("path");
const fsPromises = require("fs").promises;

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

module.exports = { attachFile, attachFiles };
