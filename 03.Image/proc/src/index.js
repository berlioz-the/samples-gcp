const _ = require('lodash');
const Promise = require('the-promise');
const berlioz = require('berlioz-sdk');
const filterous = require('filterous');
const Stream = require('stream');

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
    console.log('[processSubscription] ...')

    var pullRequest = {
        maxMessages: 5
    }
    return berlioz.queue('jobs').client('pubsub-subscriber').pull(pullRequest)
        .then(responses => {
            console.log(responses);
            return Promise.serial(responses.receivedMessages, x => processMessage(x));
        })
        .catch(reason => {
            if (reason.code == 4) {
                console.log('[processSubscription] DEADLINE_EXCEEDED...');
                return;
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
    return downloadImage(data.name)
        .then(buf => {
            console.log('[processMessage] orig buffer size: %s', buf.length)
            return processImage(buf);
        })
        .then(buf => {
            console.log('[processMessage] processed buffer size: %s', buf.length)
            return uploadImage(data.name, buf);
        })
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

function downloadImage(id)
{
    return new Promise((resolve, reject) => {
        berlioz.database('images').client('storage').file('orig/' + id)
            .then(file => {
                return file.createReadStream();
            })
            .then(stream => {
                var bufs = [];
                stream.on('data', d => {
                    bufs.push(d);
                });
                stream.on('end', () => {
                    var buf = Buffer.concat(bufs);
                    resolve(buf)
                });
                stream.on('error', (error) => {
                    console.log(error);
                    reject(error);
                });
            })
            .catch(reason => {
                console.log(reason);
                reject(reason);
            });
    });
}

function processImage(buf)
{
    console.log('[processImage] buffer size: %s', buf.length);
    var image = filterous.importImage(buf, {});
    image.applyInstaFilter('amaro')
    return extractImageBuffer(image);
}

function uploadImage(id, buf)
{
    var stream = new Stream.PassThrough();
    stream.end( buf );

    return new Promise((resolve, reject) => {
        berlioz.database('images').client('storage').file('processed/' + id)
            .then(file => {
                return file.createWriteStream();
            })
            .then(writeStream => {
                stream.pipe(writeStream)
                    .on('error', (error) => {
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

function extractImageBuffer(image)
{
    return new Promise((resolve, reject) => {
        let type = 'image/' + image.options.format;

        image.canvas.toDataURL(type, (err, base64) => {
            if (err) {
                reject(err);
                return;
            }
            // Sync JPEG is not supported bu node-canvas
            let base64Data = base64.split(',')[1];
            // let binaryData = new Buffer(base64Data, 'base64');
            let binaryData = Buffer.from(base64Data, 'base64');
            resolve(binaryData);
        });
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