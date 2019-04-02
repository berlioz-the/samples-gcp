const _ = require('lodash');
const Promise = require('the-promise');
const berlioz = require('berlioz-sdk');
const mysql = require('promise-mysql');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

berlioz.addon(require('berlioz-gcp'));

function processQueue()
{
    console.log('[processQueue] ...')
    return Promise.resolve()
        .then(() => {
            return processSubscription()
        })
        .then(() => processQueue());
}

function processSubscription()
{
    console.log('[processSubscription] ', )

    var pullRequest = {
        maxMessages: 5
    }
    return berlioz.queue('jobs').client('pubsub-subscriber').pull(pullRequest)
        .then(responses => {
            console.log(responses);
            return Promise.serial(responses.receivedMessages, x => processMessage(x));
        })
        .catch(reason => {
            if (reason.code == 4) {
                console.log('[processSubscription] DEADLINE_EXCEEDED...');
                return;
            }
            console.log('[processSubscription] Error: ');
            console.log(reason);
        })
}

function acknowledgeMessage(message)
{
    console.log('[acknowledgeMessage] %s...', message.ackId)

    var ackRequest = {
        ackIds: [message.ackId]
    }
    console.log('[acknowledgeMessage] ', ackRequest)
    return berlioz.queue('jobs').client('pubsub-subscriber').acknowledge(ackRequest)
        .then(result => {
            console.log('[acknowledgeMessage] RESULT: ', result)
        })
        .catch(reason => {
            console.log('[acknowledgeMessage] Error: ');
            console.log(reason);
        })
}

function processMessage(message)
{
    console.log('[processMessage] Begin ', message)
    var data = JSON.parse(message.message.data.toString());
    console.log('[processMessage] ', data)

    const number = phoneUtil.parseAndKeepRawInput(data.phone, 'US');
    var newPhone = phoneUtil.format(number, PNF.INTERNATIONAL);

    return getConnection()
        .then(connection => {
            return connection.query(`UPDATE contacts SET phone='${newPhone}' WHERE name = '${data.name}'`)
        })
        .then(() => {
            console.log('[processMessage] uploaded.')
            return acknowledgeMessage(message);
        })
        .then(() => {
            console.log('[processMessage] message acknowledged.')
        })
        .catch(reason => {
            console.log('[processMessage] error in download: ')
            console.log(reason);
        })
}


var mysqlConfig = {
    connection: null,
    config: null
};
berlioz.database('book').monitorFirst(peer => {
    if (peer) {
        mysqlConfig.config = _.clone(peer.config);
        mysqlConfig.config.user = 'root';
        mysqlConfig.config.password = '';
        mysqlConfig.config.database = 'demo';
    } else {
        mysqlConfig.config = null;
        mysqlConfig.connection = null;
    }
});
function getConnection()
{
    if (mysqlConfig.connection) {
        return Promise.resolve(mysqlConfig.connection);
    }
    if (!mysqlConfig.config) {
        throw new Error('Database Not Present.');
    }

    console.log("Connecting to DB:");
    console.log(mysqlConfig.config);
    return Promise.resolve(mysql.createConnection(mysqlConfig.config))
        .then(result => {
            mysqlConfig.connection = result;
            return result;
        })
        .catch(reason => {
            console.log("ERROR Connecting to DB:");
            console.log(reason);
            throw new Error('Database Not Connected.');
        })
}

return processQueue()
    .then(result => {
        console.log("FINISHED: " + result);
    })
    .catch(reason => {
        console.log("ERROR: ");
        console.log(reason);
    })

    