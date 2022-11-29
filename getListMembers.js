
var Mailgun = require('mailgun-js');
var json2csv = require('json2csv');


var apiKey = '4a3e61c20c5a43e82c2ac9ce349e6aa4-2de3d545-31866b1f';
var domain = 'sandbox7c5e141eccf7446c83f519e64d6ae781.mailgun.org';


var mailgun = new Mailgun({ apiKey: apiKey, domain: domain });

var mailing_list = [];
var mailing_options = "";
mailgun.get('/lists/pages', function (error, body) {
    mailing_options = "";
    for (let item of body.items) {
        mailing_list.push({ name: item.name, email: item.address });
        mailing_options += `<option value="${item.name}">${item.name}</option>`;
    }
    console.log('Get pages /lists/pages', mailing_list);
});

// oshanetest
// testoshane@sandbox7c5e141eccf7446c83f519e64d6ae781.mailgun.org

mailgun.get('/lists/testoshane@sandbox7c5e141eccf7446c83f519e64d6ae781.mailgun.org', function (error, body) {
    console.log('Get /lists/testoshane@sandbox7c5e141eccf7446c83f519e64d6ae781.mailgun.org', body);
});



mailgun.get('/lists/testoshane@sandbox7c5e141eccf7446c83f519e64d6ae781.mailgun.org/members', function (error, body) {
    console.log('Get Members', body);
    var fields = ['address', 'name', 'subscribed'];
    var data = json2csv.parse(body.items, { fields });
    console.log("CSV Output", data);
});
