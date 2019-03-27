const _ = require('lodash');
const Promise = require('the-promise');
const berlioz = require('berlioz-sdk');
const PubSub = require('@google-cloud/pubsub');
const mysql = require('promise-mysql');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

berlioz.addon(require('berlioz-gcp'));

var SubscriptionId = null;
berlioz.queue('jobs').monitorFirst(peer => {
    console.log('[PubSub] Changed.');
    console.log(peer)
    if (peer) {
        SubscriptionId = peer.subName;
    } else {
        SubscriptionId = null;
    }
})

function processQueue()
{
    console.log('[processQueue] ...')
    return Promise.resolve()
        .then(() => {
            if (!SubscriptionId) {
                return Promise.timeout(5000); 
            } else {
                return processSubscription(SubscriptionId)
            }
        })
        .then(() => processQueue());
}

function processSubscription(id)
{
    console.log('[processSubscription] %s...', id)

    var pullRequest = {
        subscription: id,
        maxMessages: 5
    }
    return berlioz.queue('jobs').client(PubSub, 'SubscriberClient').pull(pullRequest)
        .then(responses => {
            console.log(responses);
            return Promise.serial(responses.receivedMessages, x => processMessage(id, x));
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

function acknowledgeMessage(id, message)
{
    console.log('[acknowledgeMessage] %s...', message.ackId)

    var ackRequest = {
        subscription: id,
        ackIds: [message.ackId]
    }
    console.log('[acknowledgeMessage] ', ackRequest)
    return berlioz.queue('jobs').client(PubSub, 'SubscriberClient').acknowledge(ackRequest)
        .then(result => {
            console.log('[acknowledgeMessage] RESULT: ', result)
        })
        .catch(reason => {
            console.log('[acknowledgeMessage] Error: ');
            console.log(reason);
        })
}

function processMessage(id, message)
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
            return acknowledgeMessage(id, message);
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

    