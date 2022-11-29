var express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
var path = require("path");
const bodyParser = require("body-parser");
const { convert } = require("html-to-text");
const router = express.Router();
var mime = require("mime-types");
var app = express();
var Mailgun = require("mailgun-js");
var md5 = require("md5");
var session = require("express-session");
const { v4: uuidv4 } = require("uuid");
const { parse } = require("csv-parse/sync");
const json2csv = require("json2csv");

var session_store = new session.MemoryStore();

global.__basedir = __dirname;

app.set("views", path.join(__dirname, "src"));
app.set("view engine", "pug");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());
app.set("trust proxy", 1); // trust first proxy
// app.use(session({
//     secret: 'secret-key',
//     //   resave: false,
//     saveUninitialized: false,
//     cookie: { secure: true },
//     store: session_store
// }));
app.use(
  session({
    genid: function (req) {
      return uuidv4(); // use UUIDs for session IDs
    },
    secret: "sdanusadnasid1",
  })
);

var passcode = process.env.APP_PASSCODE || "pEala2o2h%RTa21Y";
var serverPort = process.env.APP_PORT || 19081;

var server = app.listen(serverPort, function () {
  var host = server.address().address;
  var port = server.address().port;

  if (host == "::") {
    host = "http://localhost";
  }

  console.log("===> Passcode: ");
  console.log(passcode);
  console.log("");
  console.log("MailGun app listening at %s:%s", host, port);
});

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "");
}

app.use(express.static(path.join(__dirname, "src", "assets")));
app.get("/", function (req, res) {
  console.log("Check passhas", req.session.passhash);
  if (req.session.passhash == md5(passcode)) {
    return res.render("mailgun", {});
  }
  res.render("index");
});

app.post("/", function (req, res) {
  if (req.body.passcode == passcode) {
    req.session.authenticated = true;
    req.session.passhash = md5(req.body.passcode);

    console.log("Got passcode", req.body.passcode);
    console.log("Got passhas", req.session.passhash);
    res.render("mailgun", {});
  } else {
    req.session.passhash = 0;
    console.log("Got passhas", req.session.passhash);
    res.render("index", { error: "Invalid Mailing credentials" });
  }
});

// Initialize Routers
const mailgunRouter = require("./src/routes/mailgun");
const testRouter = require("./src/routes/index");

app.use("/test", testRouter);
app.use("/mailgun", mailgunRouter);

app.use(express.static(path.join(__dirname, "src", "assets")));
app.get("/", function (req, res) {
  res.render("index");
});

// app.post('/message', function (req, res) {
//     try {
//         var mailgun = new Mailgun({ apiKey: req.body.apiKey, domain: req.body.domain });
//         var mailing_list = [];
//         var mailing_options = "";
//         mailgun.get('/lists/pages', function (error, body) {
//             mailing_options = "";
//             for (let item of body.items) {
//                 mailing_list.push({ name: item.name, email: item.address });
//                 mailing_options += `<option value="${item.name}">${item.name}</option>`;
//             }
//             console.log(mailing_list);
//         });
//     } catch (e) {
//         res.send("Invalid Mailing credentials");
//     }

//     var filepaths = [];
//     var fileAttachments = [];
//     try {
//         if (req.files && req.files.file) {
//             console.log('Mailgun Attachments', req.files);
//             if (Array.isArray(req.files.file)) {
//                 var uploadPath;
//                 for (let attachment of req.files.file) {
//                     if (!attachment) {
//                         continue;
//                     }
//                     uploadPath = path.join(uploadDir, attachment.name);

//                     // Use the mv() method to place the file somewhere on your server
//                     attachment.mv(uploadPath, function (err) {
//                         if (err)
//                             return res.status(500).send(err);
//                         console.log(`${attachment.name} File uploaded!`);
//                     });
//                     filepaths.push(uploadPath);
//                     fileAttachments.push(
//                         new mailgun.Attachment({
//                             data: attachment.data,
//                             contentType: attachment.mimetype,
//                             filename: path.basename(attachment.name)
//                         }),
//                     );
//                 }
//             } else {
//                 let attachment = req.files.file;
//                 var uploadPath = path.join(uploadDir, attachment.name);
//                 // Use the mv() method to place the file somewhere on your server
//                 attachment.mv(uploadPath, function (err) {
//                     if (err)
//                         return res.status(500).send(err);
//                     console.log(`${attachment.name} File uploaded!`);
//                 });
//                 filepaths.push(uploadPath);
//                 fileAttachments.push(
//                     new mailgun.Attachment({
//                         data: attachment.data,
//                         contentType: attachment.mimetype,
//                         filename: path.basename(attachment.name)
//                     }),
//                 );
//             }
//         }
//     } catch (e) {
//         console.log('Error: failed to attach files', e);
//     }

//     var custom_vars = {};
//     if (req.files && req.files.varfile) {
//         console.log('Mailgun variables', req.files);
//         var var_data = req.files.varfile.data.toString('utf8');
//         const csv_var_data = parse(var_data, {
//             columns: true,
//             skip_empty_lines: true
//         });
//         console.log('Var data', csv_var_data);
//         for (const element of csv_var_data) {
//             if (!element.email) {
//                 continue;
//             }

//             var cemail = element.email;
//             var cdata = Object.assign({}, element);
//             delete cdata['email'];
//             custom_vars[cemail] = cdata;
//         }
//         console.log("Variables", custom_vars);
//     }

//   const plaintext = convert(req.body.message, {
//     wordwrap: 130,
//   });

//   var data = {
//     from: req.body.from_email,
//     to: req.body.mailing_list,
//     subject: req.body.subject,
//     text: plaintext,
//     html: req.body.message,
//   };

//   if (fileAttachments.length >= 0) {
//     data.attachment = fileAttachments;
//   }
//   // res.send(JSON.stringify(data));

//   mailgun.messages().send(data, function (error, body) {
//     console.log(body);

//     var list = mailgun.lists(req.body.to);
//     list.members().list(function (err, members) {
//       // `members` is the list of members
//       console.log("send to members: ");
//     });

//     const plaintext = convert(req.body.message, {
//         wordwrap: 130
//     });

//     var data = {
//         from: req.body.from_email,
//         to: req.body.mailing_list,
//         subject: req.body.subject,
//         text: plaintext,
//         html: req.body.message
//     };

//     if (Object.keys(custom_vars).length !== 0) {
//         data['recipient-variables'] = JSON.stringify(custom_vars);
//     }

//     if (fileAttachments.length >= 0) {
//         data.attachment = fileAttachments;
//     }
//     // res.send(JSON.stringify(data));

//     mailgun.messages().send(data, function (error, body) {
//         console.log(body);

//         var list = mailgun.lists(req.body.to);
//         list.members().list(function (err, members) {
//             // `members` is the list of members
//             console.log('send to members: ');
//         });

//         try {
//             if ( ! mailing_list && req.session.mailing_list ) {
//                 mailing_list = JSON.parse(req.session.mailing_list);
//             }
//         } catch (error) {
//             console.log('Error', 'unable to get mailing list');
//         }

//         if (error) {
//             // email not sent
//             res.render("message", {
//                 apiKey: req.body.apiKey, domain: req.body.domain,
//                 req_data: req.body,
//                 mailing_list: mailing_list, mailing_options: mailing_options,
//                 msg: 'Error. Something went wrong.', err: true
//             });

//         } else {
//             // Yay!! Email sent
//             res.render("message", {
//                 apiKey: req.body.apiKey, domain: req.body.domain,
//                 req_data: req.body,
//                 mailing_list: mailing_list, mailing_options: mailing_options,
//                 msg: 'Message successfully sent.', err: false
//             });
//         }
//     });
// });

// // app.get('/mail/list', (req, res) => {
// //     if (!req.session.apiKey) {
// //         return res.render("error", { error: "Error: Invalid Mailing credentials" });
// //     }
//     var mailgun = new Mailgun({ apiKey: req.session.apiKey, domain: req.session.domain });
//     var mailing_list = [];
//     var mailing_options = "";
//     mailgun.get('/lists/pages', function (error, body) {
//         mailing_options = "";
//         for (let item of body.items) {
//             mailing_list.push({ name: item.name, email: item.address });
//             mailing_options += `<option value="${item.name}">${item.name}</option>`;
//         }
//         console.log(mailing_list);

//         res.render("mailing_list", { mailing_list: mailing_list });
//     });
// });

// app.get('/mail/list/download', (req, res) => {
//     if (!req.session.apiKey) {
//         return res.render("error", { error: "Error: Invalid Mailing credentials" });
//     }
//     var mailgun = new Mailgun({ apiKey: req.session.apiKey, domain: req.session.domain });
//     var email = req.query.email;

//     console.log(`/lists/${email}/members`);
//     mailgun.get(`/lists/${email}/members`, function (error, body) {

//         if (error) {
//             console.log(error);
//             return res.render("error", { error: error });
//         }

//         console.log('Get Members', body);
//         var fields = ['address', 'name', 'subscribed'];
//         var data = json2csv.parse(body.items, { fields });
//         console.log("CSV Output", data);

//         res.attachment(`${slugify(email)}.csv`);
//         res.status(200).send(data);

//     });

// })
