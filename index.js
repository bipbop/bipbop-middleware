/* jshint esversion: 6 */

const BIPBOP_FREE = '6057b71263c21e4ada266c9d4d4da613';

const cheerio = require('cheerio');
const express = require('express');
const bodyParser = require('body-parser');
const async = require('async');
const requestPromise = require('request-promise');
const jsontoxml = require('jsontoxml');
const app = express();

const cheerioOptions = {
    normalizeWhitespace: true,
    xmlMode: true
};

app.use(bodyParser.json());
app.post('/', function(req, res) {
    res.set('Content-Type', 'text/xml');

    const $ = cheerio.load('<?xml version="1.0" encoding="UTF-8"?><middleware></middleware>', cheerioOptions);

    const middleware = $('middleware');

    if (!req.body.requests || !req.body.requests.length) {
        res.send($.xml());
        return;
    }

    let start = Date.now();

    const queue = async.queue((task, callback) => requestPromise({
            uri: 'https://irql.bipbop.com.br/',
            method: 'POST',
            form: Object.assign({}, task.form, {
                suppressHTTPCode: 'true',
                apiKey: req.body.apiKey || BIPBOP_FREE
            })
        })
        .then(request => {
            let $ = cheerio.load(request, cheerioOptions);
            middleware.append($.xml($('*').first().attr("id", task.id)));
        })
        .catch(err => middleware.append($("<error />").attr("id", task.id).text(err.toString())))
        .finally(() => callback()), req.body.threads || 6);

    queue.drain = () => {
        middleware.attr("elapsed-time-ms", Date.now() - start);
        res.send($.xml());
    };

    queue.push(req.body.requests);
});

app.listen(3000);
