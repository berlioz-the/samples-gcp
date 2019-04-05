const berlioz = require('berlioz-sdk');
berlioz.addon(require('berlioz-gcp'));
var _ = require('lodash');
var Promise = require('promise');
var ejs = require('ejs');
var path = require('path');

berlioz.addon(require('berlioz-gcp'));

exports.handler = (event, callback) => {
    console.log("******************************")
    console.log(event)
    callback();
}

