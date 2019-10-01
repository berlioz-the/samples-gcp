const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs');
const {Datastore} = require('@google-cloud/datastore');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static('public'));
app.set('view engine', 'ejs');

const DatastoreInfo = JSON.parse(fs.readFileSync(`${process.env.BERLIOZ_CONSUMES_PATH}/database/store.json`));
var datastore = new Datastore(DatastoreInfo.config);


app.get('/', async (req, response) => {

    var renderData = {
        entries: []
    };

    try
    {
        const query = datastore.createQuery('user');
        const [entries] = await datastore.runQuery(query);
        renderData.entries = entries;
    }
    catch(error)
    {
        if (error instanceof Error) {
            renderData.error = error.message + error.stack;
        } else {
            renderData.error = JSON.stringify(error, null, 2);
        }
    }

    response.render('pages/index', renderData);
});


app.post('/new-contact', async (request, response) => {

    try
    {
        const entity = {
            key: datastore.key("user"),
            data: [
                {
                    name: "name",
                    value: request.body.name
                },
                {
                    name: "phone",
                    value: request.body.phone
                }
            ]
        };
        await datastore.save(entity);
        return response.send({ success: true });
    }
    catch(error)
    {
        if (error instanceof Error) {
            errorMsg = error.message + error.stack;
        } else {
            errorMsg = JSON.stringify(error, null, 2);
        }
        return response.send({ error: errorMsg });
    }
});


app.get('/debug', function (req, response) {
    var result = {
        consumes_metadata: {
            'all.json': JSON.parse(fs.readFileSync(`${process.env.BERLIOZ_CONSUMES_PATH}/all.json`)),
            'database/store.json': JSON.parse(fs.readFileSync(`${process.env.BERLIOZ_CONSUMES_PATH}/database/store.json`))
        },
        environment: process.env
    }
    response.send(result);
});


app.listen(process.env.BERLIOZ_LISTEN_PORT_DEFAULT, process.env.BERLIOZ_LISTEN_ADDRESS, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${process.env.BERLIOZ_LISTEN_ADDRESS}:${process.env.BERLIOZ_LISTEN_PORT_DEFAULT}`)
})
