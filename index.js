/* jshint esversion: 6 */

const BIPBOP_FREE = '6057b71263c21e4ada266c9d4d4da613';
const timeout = 60 * 60 * 1000;
const cheerio = require('cheerio');
const express = require('express');
const bodyParser = require('body-parser');
const async = require('async');
const requestPromise = require('request-promise');

const app = express();
const commander = require('commander');
const compression = require('compression');
const prettyMs = require('pretty-ms');
const morgan = require('morgan');
const http = require('http');
const https = require('https');
const fs = require('fs');

commander
  .version('1.0.0')
  .option('-p, --port [port]', 'Binds and listens for connections on the specified port [port]', '3000')
  .option('-s, --sslPort [port]', 'Binds and listens for connections on the specified sslPort [sslPort]', '3001')
  .parse(process.argv);

const cheerioOptions = {
  normalizeWhitespace: true,
  xmlMode: true,
};

app.use(compression());
app.use(bodyParser.json({ extended: true, limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

app.post('/', (req, res) => {
  res.set('Content-Type', 'text/xml');

  const $ = cheerio.load('<?xml version="1.0" encoding="UTF-8"?><middleware></middleware>', cheerioOptions);

  const middleware = $('middleware');

  if (!req.body.requests || !req.body.requests.length) {
    res.send($.xml());
    return;
  }

  const start = Date.now();

  const queue = async.queue((task, callback) => requestPromise({
    uri: 'https://irql.bipbop.com.br/',
    method: 'POST',
    form: Object.assign({}, task.form, {
      suppressHTTPCode: 'true',
      apiKey: req.body.apiKey || BIPBOP_FREE,
    }),
  })
    .then((request) => {
      const $request = cheerio.load(request, cheerioOptions);
      middleware.append($request.xml($request('*').first().attr('id', task.id)));
    })
    .catch(err => middleware.append($('<error />').attr('id', task.id).text(err.toString())))
    .finally(() => callback()), (req.body.threads || 5) > 10 ? 10 : 5);

  queue.drain = () => {
    middleware.attr('elapsed-time-ms', prettyMs(Date.now() - start));
    middleware.attr('jobs', req.body.requests.length.toString());
    res.send($.xml());
  };

  setTimeout(() => queue.kill(), timeout);
  queue.push(req.body.requests);
});

const httpsServer = https.createServer({
  key: fs.readFileSync('/etc/letsencrypt/keys/0000_key-certbot.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/csr/0000_csr-certbot.pem'),

}, app).listen(443);
const httpServer = http.createServer(app).listen(80);

httpServer.timeout = timeout;
httpsServer.timeout = timeout;
