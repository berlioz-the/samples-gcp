const berlioz = require('berlioz-sdk');
berlioz.addon(require('berlioz-gcp'));
var _ = require('lodash');
var Promise = require('promise');
var ejs = require('ejs');
var path = require('path');

berlioz.addon(require('berlioz-gcp'));

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

exports.handler = (req, res) => {

    var renderData = {
        entries: []
    }

    return Promise.resolve()
        .then(() => {
            if (req.method == 'POST') {
                return processPost(req, renderData);
            }
        })
        .then(() => processGet(req, renderData))
        .catch(reason => {
            renderData.error = reason;
        })
        .then(() => renderResult(res, renderData));
}

function processGet(req, renderData)
{
    const firestore = new Firestore(mysqlConfig.peerConfig);
    var collection = firestore.collection('contacts');
    return collection.listDocuments()
        .then(documentRefs => {
            return firestore.getAll(documentRefs);
        }).then(documentSnapshots => {
            documentSnapshots = documentSnapshots.filter(x => x.exists);
            var datas = documentSnapshots.map(x => x.data());
            console.log(datas);
            return datas;
        })
        .then(result => {
            renderData.entries = result;
        })
};

function processPost(req, renderData)
{
    const firestore = new Firestore(mysqlConfig.peerConfig);
    var document = firestore.doc(`contacts/${req.body.name}`);
    return document.set(req.body);
}

function renderResult(res, renderData)
{
    ejs.renderFile(
        path.join(__dirname, 'views', 'index.ejs'),
        renderData,
        (err, html) => {
            if (err) {
                res.send(err);
            } else {
                res.send(html);
            }
        });
}
