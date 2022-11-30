const path = require("path");
const fs = require("fs");
const csv = require("csvtojson");
const { parse } = require("csv-parse/sync");
const flatten = require("flat");

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

const renameKey = (oldKey, newKey) => {
  _.reduce(
    obj,
    (newObj, value, key) => {
      newObj[oldKey === key ? newKey : key] = value;
      return newObj;
    },
    {}
  );
};

const generateRecipientVariablesCSV = async (req) => {
  let custom_vars = {};
  if (req.files && req.files.varfile) {
    console.log("Mailgun variables", req.files);

    let var_data = req.files.varfile.data.toString("utf8");

    const jsonVars = await csv().fromString(var_data);

    let recipientVars = flatten(jsonVars, { maxDepth: 3 });

    console.log(recipientVars);

    // Remove redundant "0." added to object keys from flattening
    for (let recipientVar of Object.keys(recipientVars)) {
      recipientVars[recipientVar.replace("0.", "")] =
        recipientVars[recipientVar];

      delete recipientVars[recipientVar];
    }

    console.log(recipientVars);
    return recipientVars;
  }
};

module.exports = { attachFile, attachFiles, generateRecipientVariablesCSV };
