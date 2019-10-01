const berlioz = require('berlioz-sdk');
berlioz.addon(require('berlioz-gcp'));
var _ = require('lodash');
var Promise = require('promise');
var ejs = require('ejs');
var path = require('path');

berlioz.addon(require('berlioz-gcp'));

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
    const client = berlioz.database('store').client('firestore');
    return client.collection('contacts').listDocuments()
        .then(documentRefs => {
            return client.getAll(documentRefs);
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
    const client = berlioz.database('store').client('firestore');
    return client.doc(`contacts/${req.body.name}`).set(req.body);
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
