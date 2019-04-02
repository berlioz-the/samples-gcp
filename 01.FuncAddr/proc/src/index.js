const berlioz = require('berlioz-sdk');
berlioz.addon(require('berlioz-gcp'));
const _ = require('lodash');
const Promise = require('promise');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

exports.handler = (event, callback) => {
    const pubsubMessage = event.data;
    const strData = Buffer.from(pubsubMessage.data, 'base64').toString();
    console.log(`Message: ${strData}`);
    var body = JSON.parse(strData);

    const number = phoneUtil.parseAndKeepRawInput(body.phone, 'US');
    var newPhone = phoneUtil.format(number, PNF.INTERNATIONAL);

    console.log(`Connecting to database...`);
    var connection = getConnection();
    console.log(`Updating...`);
    return connection.query(`UPDATE contacts SET phone='${newPhone}' WHERE name='${body.name}'`)
        .then(() => {
            console.log(`Done.`);
            callback();
        });
}

function getConnection()
{
    return berlioz.database('book').client('mysql', {
        user: 'root',
        password: '',
        database: 'demo'
    });
}
