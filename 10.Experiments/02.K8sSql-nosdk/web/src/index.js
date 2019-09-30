const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs');
const Promise = require('promise');
const MySql = require('promise-mysql');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static('public'));
app.set('view engine', 'ejs');

const DBInfo = JSON.parse(fs.readFileSync(`${process.env.BERLIOZ_CONSUMES_PATH}/database/book.json`));
const DBConfig = DBInfo.config;
DBConfig.user = 'root';
DBConfig.password = '';
DBConfig.database = 'demo';
var DBConnection = null;


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


app.get('/debug', function (req, response) {
    var result = {
        consumes_metadata: {
            'all.json': JSON.parse(fs.readFileSync(`${process.env.BERLIOZ_CONSUMES_PATH}/all.json`)),
            'database/book.json': JSON.parse(fs.readFileSync(`${process.env.BERLIOZ_CONSUMES_PATH}/database/book.json`))
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


function executeQuery(querySql)
{
    console.log(`[executeQuery] query: ${querySql}`)
    return getConnection()
        .then(connection => connection.query(querySql))
        .then(result => {
            console.log(`Query ${querySql} result:`)
            console.log(result)
            return result;
        });
}

function getConnection()
{    
    if (global.DBConnection) {
        return Promise.resolve(global.DBConnection);
    }
    return MySql.createConnection(DBConfig)
        .then(connection => {
            global.DBConnection = connection;
            return global.DBConnection;
        })
}