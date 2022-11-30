const path = require("path");
const fs = require("fs");

const attachFile = async (res, uploadDir, attachment, fileAttachments) => {
  // Uploads file to server
  let uploadPath = path.join(uploadDir, attachment.name);

  // Move the file somewhere onto your server
  attachment.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    } else {
      console.log(`${attachment.name} File uploaded!`);
    }
  });

  // Prepare file for mailgun
  const file = {
    filename: attachment.name,
    data: fs.readFileSync(uploadPath),
  };

  console.log(file);
  fileAttachments.push(file);
};
const attachFiles = async (req, res, uploadDir) => {
  // Check for attachment
  let fileAttachments = [];

  if (req.files && req.files.file) {
    console.log("Files");
    console.log(req.files);
    if (Array.isArray(req.files.file)) {
      for (let attachment of req.files.file) {
        if (!attachment) {
          continue;
        }
        attachFile(res, uploadDir, attachment, fileAttachments);
      }
    } else {
      attachFile(res, uploadDir, req.files.file, fileAttachments);
    }
  }

  return fileAttachments;
};

module.exports = { attachFile, attachFiles };
