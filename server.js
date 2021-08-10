var express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs')
var path = require('path');
const bodyParser = require('body-parser');
const { convert } = require('html-to-text');
const router = express.Router();
var app = express();
var Mailgun = require('mailgun-js');

const uploadDir = path.join(__dirname, 'uploads');

app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json())
app.use(fileUpload());

var server = app.listen(19081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
})

app.use(express.static('src/static/'));
app.get('/', function (req, res) {
    res.sendFile( __dirname + "/src/views/" + "index.html" );
});

app.post('/', function(req, res) {
    try {
        var mailgun = new Mailgun({ apiKey: req.body.apiKey, domain: req.body.domain });
        mailgun.get('/lists/pages', function (error, body) {
            mailing_list = [];
            mailing_options = "";
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
    try {
        if ( req.files.file ) {
            if ( Array.isArray(req.files.file) ) {
                for(let attachment of req.files.file) {
                    uploadPath = path.join(uploadDir, attachment.name);
            
                    // Use the mv() method to place the file somewhere on your server
                    attachment.mv(uploadPath, function(err) {
                    if (err)
                        return res.status(500).send(err);
                    console.log(`${attachment.name} File uploaded!`);
                    });
                    filepaths.push(uploadPath);
                }
            } else {
                let attachment = req.files.file;
                uploadPath = path.join(uploadDir, attachment.name);
                // Use the mv() method to place the file somewhere on your server
                attachment.mv(uploadPath, function(err) {
                if (err)
                    return res.status(500).send(err);
                console.log(`${attachment.name} File uploaded!`);
                });
                filepaths.push(uploadPath);
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


    for(let fileAttach of filepaths) {
        try {
            if (fs.existsSync(fileAttach)) {
              if ( ! data.attachment ) {
                  data.attachment = [];
              }
              var fileContent = fs.readFileSync(fileAttach);
              data.attachment.push(
                new mailgun.Attachment({
                    data: fileContent,
                    filename: path.basename(fileAttach)
                }),
              );
            }
          } catch(err) {
            console.error(err)
            continue;
          }
    }

    // res.send(JSON.stringify(data));

    mailgun.messages().send(data, function(error, body) {
        console.log(body);

        var list =  mailgun.lists(req.body.to);
        list.members().list(function (err, members) {
            // `members` is the list of members
            console.log('send to members: ', members);
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