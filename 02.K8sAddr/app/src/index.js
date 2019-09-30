const express = require('express');
const berlioz = require('berlioz-sdk');
const _ = require('lodash');
const Promise = require('the-promise');

const app = express();
berlioz.setupExpress(app);
berlioz.addon(require('berlioz-gcp'));

app.set('view engine', 'ejs');

const BookClient = berlioz.database('book').client('mysql', {
    user: 'root',
    password: '',
    database: 'demo'
});
const JobsClient = berlioz.queue('jobs').client('pubsub-publisher');

app.get('/', (request, response) => {
    var data = {
        myId: process.env.BERLIOZ_TASK_ID,
        message: 'Hello From App Tier',
        myDbPeers: berlioz.database('book').all()
    }
    response.send(data);
})

app.get('/entries', (request, response) => {
    return executeQuery('SELECT * FROM contacts')
        .then(contacts => {
            return Promise.serial(contacts, contact => {
                var options = { url: `/status/${contact.id}`, json: true };
                return berlioz.cluster('phone').request(options)
                    .then(status => {
                        console.log("**** THEN:")
                        console.log(status)
                        contact.status = status;
                        contact.status.success = true;
                    })
                    .catch(reason => {
                        console.log("**** CATCH:")
                        console.log(reason.message);
                        contact.status = {
                            success: false
                        };
                    })
                    .then(() => {
                        console.log("**** CONTACT:")
                        console.log(contact);
                        return contact;
                    });
            });
        })
        .then(contacts => {
            console.log("**** FINAL CONTACTS:")
            console.log(contacts);
            response.send(contacts);
        })
        .catch(reason => {
            console.log("**** FINAL ERROR:")
            console.log(reason);
            response.status(400).send({
               error: reason.message
            });
        })
})

app.post('/entry', (request, response) => {
    if (!request.body.name || !request.body.phone) {
        return response.send({error: 'Missing name or phone'});
    }
    var querySql = `INSERT INTO contacts(name, phone) VALUES('${request.body.name}', '${request.body.phone}')`;
    return executeQuery(querySql)
        .then(() => {
            return publishJob(request.body);
        })
        .then(() => {
            response.send({ success: true });
        })
        .catch(reason => {
            response.status(400).send({
               error: reason.message
            });
        })
})

app.post('/call', (request, response) => {
    var options = {
        url: '/perform',
        method: 'POST',
        body: request.body,
        json: true
    };
    return berlioz.cluster('phone').request(options)
        .then(() => {
            response.send({ success: true });
        })
        .catch(reason => {
            console.log(reason);
            response.send({ success: false, error: reason });
        })
});


function publishJob(msg)
{
    const msgRequest = {
        messages: [
            {
                data: Buffer.from(JSON.stringify(msg))
            }
        ],
    };
    console.log("[publishJob] " + JSON.stringify(msgRequest, null, 4));
    return JobsClient.publish(msgRequest);
}

app.listen(process.env.BERLIOZ_LISTEN_PORT_DEFAULT,
           process.env.BERLIOZ_LISTEN_ADDRESS, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log(`server is listening on ${process.env.BERLIOZ_LISTEN_ADDRESS}:${process.env.BERLIOZ_LISTEN_PORT_DEFAULT}`)
})

function executeQuery(querySql)
{
    return BookClient.query(querySql);
}
