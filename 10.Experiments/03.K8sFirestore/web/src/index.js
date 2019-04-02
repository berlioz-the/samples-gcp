const express = require('express')
const Promise = require('promise');
const berlioz = require('berlioz-sdk');
berlioz.addon(require('berlioz-gcp'));

const app = express();
berlioz.setupExpress(app);

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function (req, response) {
    var renderData = {
        entries: []
    };

    Promise.resolve()
        .then(() => {
            var client = berlioz.database('store').client('firestore');
            return client.collection('users').listDocuments()
                .then(documentRefs => {
                    return firestore.getAll(documentRefs);
                }).then(documentSnapshots => {
                    documentSnapshots = documentSnapshots.filter(x => x.exists);
                    var datas = documentSnapshots.map(x => x.data());
                    console.log(datas);
                    return datas;
                 })
        })
        .then(result => {
            if (result) {
                renderData.entries = result;
            }
        })
        .catch(error => {
            if (error instanceof Error) {
                renderData.error = error.message + error.stack;
            } else {
                renderData.error = JSON.stringify(error, null, 2);
            }
        })
        .then(() => {
            response.render('pages/index', renderData);
        })
        ;
});

app.post('/new-contact', (request, response) => {
    var client = berlioz.database('store').client('firestore');
    return client.doc(`users/${request.body.name}`).set(request.body)
        .then(() => {
            return response.send({ success: true });
        })
        .catch(error => {
            console.log(error);
            console.log(error.message);
            console.log(error.stack);
            var errorMsg;
            if (error instanceof Error) {
                errorMsg = error.message + error.stack;
            } else {
                errorMsg = JSON.stringify(error, null, 2);
            }
            return response.send({ error: errorMsg });
        });
});

app.listen(process.env.BERLIOZ_LISTEN_PORT_DEFAULT, process.env.BERLIOZ_LISTEN_ADDRESS, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${process.env.BERLIOZ_LISTEN_ADDRESS}:${process.env.BERLIOZ_LISTEN_PORT_DEFAULT}`)
})
