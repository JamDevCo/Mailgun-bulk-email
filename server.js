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
