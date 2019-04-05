const express = require('express')
const Promise = require('promise');
const berlioz = require('berlioz-sdk');
berlioz.addon(require('berlioz-gcp'));

const app = express();
berlioz.setupExpress(app);

const FirestoreClient = berlioz.database('store').client('firestore');

app.get('/', function (req, response) {
    var result = {
        status: 'ok'
    };
    response.send(result);
});

app.get('/status/:id', function (req, response) {
    FirestoreClient
        .doc(`phone/${req.params.id}`)
        .get()
        .then(documentSnapshot => {
            if (documentSnapshot.exists) {
                return documentSnapshot.data();
            } else {
                return {};
            }
        })
        .then(data => {
            data.success = true;
            response.send(data);
        })
});

app.post('/perform', (request, response) => {
    var body = {

    }
    if (request.body.action == 'call') {
        body.inCall = true;
    } else {
        body.inCall = false;
    }
    FirestoreClient
        .doc(`phone/${request.body.id}`)
        .set(body)
        .then(() => {
            response.send({ success: true });
        })
});

app.listen(process.env.BERLIOZ_LISTEN_PORT_DEFAULT, process.env.BERLIOZ_LISTEN_ADDRESS, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${process.env.BERLIOZ_LISTEN_ADDRESS}:${process.env.BERLIOZ_LISTEN_PORT_DEFAULT}`)
})
