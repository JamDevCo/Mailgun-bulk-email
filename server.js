var express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs')
var path = require('path');
const bodyParser = require('body-parser');
const { convert } = require('html-to-text');
const router = express.Router();
var mime = require('mime-types')
var app = express();
var Mailgun = require('mailgun-js');
var md5 = require('md5');
var session = require('express-session')
var session_store = new session.MemoryStore();

const uploadDir = path.join(__dirname, 'uploads');

app.set('views', path.join(__dirname, 'src'));
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json())
app.use(fileUpload());
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'secret-key',
//   resave: false,
  saveUninitialized: false,
  cookie: { secure: true },
  store: session_store
}));

var passcode = process.env.APP_PASSCODE || "pEala2o2h%RTa21Y";
var serverPort = process.env.APP_PORT || 19081;

var server = app.listen(serverPort, function () {
   var host = server.address().address;
   var port = server.address().port;

   if (host == "::") {
        host = 'http://localhost';
   }

   console.log("===> Passcode: ")
   console.log(passcode)
   console.log("");
   console.log("MailGun app listening at %s:%s", host, port)
})

app.use(express.static(path.join(__dirname, 'src', 'assets')));
app.get('/', function (req, res) {
    res.render("index");
});

app.post('/', function (req, res) {
    if ( req.body.passcode == passcode ) {
        req.session.authenticated = true;
        req.session.passhash = md5(req.body.passcode);

        console.log("Got passcode", req.body.passcode);
        console.log("Got passhas", req.session.passhash);
        res.render("mailgun", {});
    } else {
        req.session.passhash = 0;
        console.log("Got passhas", req.session.passhash);
        res.render("index", { error: "Invalid Mailing credentials"});
    }
});


app.post('/mg', function(req, res) {
    try {
        var mailgun = new Mailgun({ apiKey: req.body.apiKey, domain: req.body.domain });
        mailgun.get('/lists/pages', function (error, body) {
            mailing_list = [];
            mailing_options = "";
            console.log("body", body);
            console.log('error',)
            if ( ! body.items ) {
                res.render("mailgun", {
                    error: body.message
                });
            } else {
                for(let item of body.items) {
                    mailing_list.push({name: item.name, email: item.address});
                    mailing_options += `<option value="${item.address}">${item.address}</option>`;
                }
                console.log(mailing_list);
                res.render("message", {
                    apiKey: req.body.apiKey, domain: req.body.domain,
                    req_data: req.body,
                    mailing_list: mailing_list, mailing_options: mailing_options,
                    msg: 'Send Custom Message to Mailing List.', err: false
                });
            }
        });
    } catch (e) {
        res.send("Invalid Mailing credentials");
    }
});


app.post('/message', function(req, res) {
    try {
        var mailgun = new Mailgun({ apiKey: req.body.apiKey, domain: req.body.domain });
        var mailing_list = [];
        var mailing_options = "";
        mailgun.get('/lists/pages', function (error, body) {
            mailing_options = "";
            for(let item of body.items) {
                mailing_list.push({name: item.name, email: item.address});
                mailing_options += `<option value="${item.name}">${item.name}</option>`;
            }
            console.log(mailing_list);
        });
    } catch (e) {
        res.send("Invalid Mailing credentials");
    }

    var filepaths = [];
    var fileAttachments = [];
    try {
        console.log('TEST REST', req.files);
        if ( req.files && req.files.file ) {
            if ( Array.isArray(req.files.file) ) {
                var uploadPath;
                for(let attachment of req.files.file) {
                    if ( ! attachment ) {
                        continue;
                    }
                    uploadPath = path.join(uploadDir, attachment.name);
            
                    // Use the mv() method to place the file somewhere on your server
                    attachment.mv(uploadPath, function(err) {
                    if (err)
                        return res.status(500).send(err);
                    console.log(`${attachment.name} File uploaded!`);
                    });
                    filepaths.push(uploadPath);
                    fileAttachments.push(
                        new mailgun.Attachment({
                            data: attachment.data,
                            contentType: attachment.mimetype,
                            filename: path.basename(attachment.name)
                        }),
                    );
                }
            } else {
                let attachment = req.files.file;
                var uploadPath = path.join(uploadDir, attachment.name);
                // Use the mv() method to place the file somewhere on your server
                attachment.mv(uploadPath, function(err) {
                if (err)
                    return res.status(500).send(err);
                console.log(`${attachment.name} File uploaded!`);
                });
                filepaths.push(uploadPath);
                fileAttachments.push(
                    new mailgun.Attachment({
                        data: attachment.data,
                        contentType: attachment.mimetype,
                        filename: path.basename(attachment.name)
                    }),
                );
            }
        }
    } catch (e) {
        console.log('err', e);
    }


    const plaintext = convert(req.body.message, {
        wordwrap: 130
      });

    var data = {
        from: req.body.from_email,
        to: req.body.mailing_list,
        subject: req.body.subject,
        text: plaintext,
        html: req.body.message
    };


    if ( fileAttachments.length >= 0 ) {
        data.attachment = fileAttachments;
    }
    // res.send(JSON.stringify(data));

    mailgun.messages().send(data, function(error, body) {
        console.log(body);

        var list =  mailgun.lists(req.body.to);
        list.members().list(function (err, members) {
            // `members` is the list of members
            console.log('send to members: ');
        });

        if (error) {
            // email not sent
            res.render("message", {
                apiKey: req.body.apiKey, domain: req.body.domain,
                req_data: req.body,
                mailing_list: mailing_list, mailing_options: mailing_options,
                msg: 'Error. Something went wrong.', err: true
            });

        } else {
            // Yay!! Email sent
            res.render("message", {
                apiKey: req.body.apiKey, domain: req.body.domain,
                req_data: req.body,
                mailing_list: mailing_list, mailing_options: mailing_options,
                msg: 'Message successfully sent.', err: false
            });
        }
    });
});