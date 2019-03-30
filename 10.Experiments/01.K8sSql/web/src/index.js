const express = require('express')
const Promise = require('promise');
const _ = require('lodash');
const berlioz = require('berlioz-sdk');
const mysql = require('promise-mysql');

const app = express();
berlioz.setupExpress(app);
berlioz.addon(require('berlioz-gcp'));

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function (req, response) {
    var renderData = {
        entries: []
    };

    return executeQuery('SELECT * FROM contacts')
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
    if (!request.body.name || !request.body.phone) {
        return response.send({error: 'Missing name or phone'});
    }
    var querySql = `INSERT INTO contacts(name, phone) VALUES('${request.body.name}', '${request.body.phone}')`;
    return executeQuery(querySql)
        .then(result => {
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


function executeQuery(querySql)
{
    console.log(`[executeQuery] begin`)
    return Promise.resolve(getConnection())
        .then(connection => {
            console.log(`Executing query: ${querySql}`)
            return connection.query(querySql);
        })
        .then(result => {
            console.log(`Query ${querySql} result:`)
            console.log(result)
            return result;
        })
}

var mysqlConfig = {
    connection: null,
    config: null
};
berlioz.database('book').monitorFirst(peer => {
    if (peer) {
        mysqlConfig.config = _.clone(peer.config);
        mysqlConfig.config.user = 'root';
        mysqlConfig.config.password = '';
        mysqlConfig.config.database = 'demo';
    } else {
        mysqlConfig.config = null;
        mysqlConfig.connection = null;
    }
});
function getConnection()
{
    if (mysqlConfig.connection) {
        return Promise.resolve(mysqlConfig.connection);
    }
    if (!mysqlConfig.config) {
        throw new Error('Database Not Present.');
    }

    console.log("Connecting to DB:");
    console.log(mysqlConfig.config);
    return Promise.resolve(mysql.createConnection(mysqlConfig.config))
        .then(result => {
            console.log("Connected to DB.");
            mysqlConfig.connection = result;
            return result;
        })
        .catch(reason => {
            console.log("ERROR Connecting to DB:");
            console.log(reason);
            throw new Error('Database Not Connected.');
        })
}
