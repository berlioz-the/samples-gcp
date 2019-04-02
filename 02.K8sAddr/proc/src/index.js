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
            return Promise.serial(responses[0].receivedMessages, x => processMessage(x));
        })
        .catch(reason => {
            if (reason.code == 4) {
                console.log('[processSubscription] DEADLINE_EXCEEDED...');
                return Promise.timeout(5000);
            }
            if (reason.message == 'No peer found.') {
                console.log('[processSubscription] No Peer. Waiting...');
                return Promise.timeout(5000);
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

    return executeQuery(`UPDATE contacts SET phone='${newPhone}' WHERE name = '${data.name}'`)
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


function executeQuery(querySql)
{
    var connection = getConnection();
    return connection.query(querySql);
}

function getConnection()
{
    return berlioz.database('book').client('mysql', {
            user: 'root',
            password: '',
            database: 'demo'
        });
}

return processQueue()
    .then(result => {
        console.log("FINISHED: " + result);
    })
    .catch(reason => {
        console.log("ERROR: ");
        console.log(reason);
    })

    