const berlioz = require('berlioz-sdk');
berlioz.addon(require('berlioz-gcp'));
const _ = require('lodash');
const Promise = require('the-promise');
const ejs = require('ejs');
const path = require('path');
const Readable = require('stream').Readable;

berlioz.addon(require('berlioz-gcp'));

const StorageClient = berlioz.database('contacts').client('storage');

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
    return StorageClient.getFiles()
        .then(files => {
            files = files[0];
            return Promise.serial(files, x => downloadFile(x));
        })
        .then(result => {
            renderData.entries = result;
        })
};

function downloadFile(file)
{
    console.log(`******** DOWNLOAD FILE *******`);
    // console.log(file);
    console.log(`Name: ${file.name}`);
    return file.download()
        .then(data => {
            const contents = data[0];
            console.log(`Contents: ${contents}`);
            return JSON.parse(contents);
        });
}

function processPost(req, renderData)
{
    return new Promise((resolve, reject) => {
        const stream = new Readable();
        stream._read = () => {}; // redundant? see update below
        stream.push(JSON.stringify(req.body, null, 4));
        stream.push(null);

        StorageClient.file(`${req.body.name}.json`)
            .createWriteStream()
            .then(writeStream => {
                stream.pipe(writeStream)
                    .on('error', (error) => {
                        console.log(error);
                        reject(error);
                    })
                    .on('finish', () => {
                        resolve();
                    });
            })
            .catch(reason => {
                reject(reason);
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
