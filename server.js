var express = require('express');
var path = require('path');
const bodyParser = require('body-parser');
const router = express.Router();
var app = express();
var Mailgun = require('mailgun-js');

app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false}));
app.use(bodyParser.json())

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
                mailing_options += `<option value="${item.name}">${item.name}</option>`;
            }
            console.log(mailing_list);
            res.render("message", {
                apiKey: req.body.apiKey, domain: req.body.domain,
                req_data: req.body,
                mailing_list: mailing_list, mailing_options: mailing_options
            });
        });
    } catch (e) {
        res.send("Invalid Mailing credentials");
    }
});


app.post('/message', function(req, res) {
    res.send(JSON.stringify(req.body));
    // var mailgun = new Mailgun({ apiKey: req.body.apiKey, domain: req.body.domain });

    // var plaintext = JSDOM.fragment(req.body.message).textContent;
    // console.log(plaintext);
    // res.send(plaintext);
    // var data = {
    //     from: req.body.from_name + "<" + req.body.from_email + ">",
    //     to: req.body.to,                
    //     subject: req.body.subject,       
    //     text: req.body.plaintext,
    //     html: req.body.message,
    //     'o:tag': req.body.tag
    // };
    // console.log(req.body);

    // mailgun.messages().send(data, function(error, body) {
    //     console.log(body);

    //     var list =  mailgun.lists(req.body.to);
    //     list.members().list(function (err, members) {
    //           // `members` is the list of members
    //           console.log(members);
    //         });

    //     if (error) {
    //         // email not sent
    //         res.render('index', { title: 'No Email', msg: 'Error. Something went wrong.', err: true })
    //     } else {
    //         // Yay!! Email sent
    //         res.render('index', { title: 'Sent Email', msg: 'Yay! Message successfully sent.', err: false })
    //     }
    // });
});