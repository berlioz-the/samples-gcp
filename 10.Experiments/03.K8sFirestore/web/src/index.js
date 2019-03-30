const express = require('express')
const Promise = require('promise');
const berlioz = require('berlioz-sdk');
berlioz.addon(require('berlioz-gcp'));

const app = express();
berlioz.setupExpress(app);

app.use(express.static('public'));
app.set('view engine', 'ejs');

const Firestore = require('@google-cloud/firestore');

var mysqlConfig = {
    peerConfig: null
};

berlioz.database('store').monitorFirst(peer => {
    if (peer) {
        mysqlConfig.peerConfig = peer.config;
    } else {
        mysqlConfig.peerConfig = null;
    }
    console.log(mysqlConfig)
});

app.get('/', function (req, response) {
    var renderData = {
        entries: []
    };

    // var options = { url: '/entries', json: true, resolveWithFullResponse: true };
    // return berlioz.service('app').request(options)
    Promise.resolve()
        .then(() => {
            const firestore = new Firestore(mysqlConfig.peerConfig);
            var collection = firestore.collection('aaa');
            return collection.listDocuments()
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
                renderData.error = error.stack + error.stack;
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
    var options = { url: '/entry', method: 'POST', body: request.body, json: true };
    return berlioz.service('app').request(options)
        .then(result => {
            if (!result) {
                return response.send({ error: 'No app peers present.' });
            }
            return response.send(result);
        })
        .catch(error => {
            return response.send({ error: error });
        });
});

app.listen(process.env.BERLIOZ_LISTEN_PORT_DEFAULT, process.env.BERLIOZ_LISTEN_ADDRESS, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${process.env.BERLIOZ_LISTEN_ADDRESS}:${process.env.BERLIOZ_LISTEN_PORT_DEFAULT}`)
})
