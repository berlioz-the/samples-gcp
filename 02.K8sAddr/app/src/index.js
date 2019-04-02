const express = require('express');
const berlioz = require('berlioz-sdk');
const _ = require('lodash');
const Promise = require('promise');

const app = express();
berlioz.setupExpress(app);
berlioz.addon(require('berlioz-gcp'));

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
        .then(result => {
            response.send(result);
        })
        .catch(reason => {
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
    return berlioz.queue('jobs').client('pubsub-publisher')
        .publish(msgRequest);
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
