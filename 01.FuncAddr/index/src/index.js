const berlioz = require('berlioz-sdk');
berlioz.addon(require('berlioz-gcp'));
var _ = require('lodash');
var Promise = require('promise');
var ejs = require('ejs');
var path = require('path');

exports.handler = (req, res) => {

    var renderData = {
        entries: []
    }

    var connection = getConnection();
    return Promise.resolve()
        .then(() => {
            if (req.method == 'POST') {
                return processPost(connection, req, renderData);
            }
        })
        .then(() => processGet(connection, req, renderData))
        .catch(reason => {
            renderData.error = reason;
        })
        .then(() => renderResult(res, renderData));
}

function processGet(connection, req, renderData)
{
    return connection.query(`SELECT * FROM contacts`)
        .then(result => {
            renderData.entries = result;
        })
};

function processPost(connection, req, renderData)
{
    return connection.query(`INSERT INTO contacts(name, phone) VALUES('${req.body.name}', '${req.body.phone}')`)
        .then(() => {
            return publishMessage({
                name: req.body.name,
                phone: req.body.phone
            });
        });
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

function publishMessage(msg)
{
    const msgRequest = {
        messages: [
            {
                data: Buffer.from(JSON.stringify(msg))
            }
        ],
    };
    return berlioz.queue('jobs').client('pubsub-publisher')
        .publish(msgRequest);
}

function getConnection()
{
    return berlioz.database('book').client('mysql', {
            user: 'root',
            password: '',
            database: 'demo'
        });
}
