
/* jshint esversion: 6 */

const timeout = 60 * 60 * 1000;
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const commander = require('commander');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const https = require('https');
const fs = require('fs');
const uuidv4 = require('uuid/v4');

const syncronized = require('./services');

commander
  .version('1.0.0')
  .option('-p, --port [port]', 'Binds and listens for connections on the specified port [port]', '3000')
  .option('-s, --sslPort [port]', 'Binds and listens for connections on the specified sslPort [sslPort]', '3001')
  .parse(process.argv);

app.use(compression());
app.use(bodyParser.json({ extended: true, limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

const responses = {};

app.get('/token/:token', (req, res) => {
  const { token } = req.params;
  if (responses[token]) {
    res.set('Content-Type', 'text/xml');
    res.send(responses[token]);
    delete responses[token];
    return;
  }
  res.set('Content-Type', 'text/plain');
  res.send(token);
});

app.post('/token', (req, res, next) => {
  res.set('Content-Type', 'text/plain');
  res.token = uuidv4();
  res.send(res.token);
  next();
}, syncronized((req, res, response) => {
  responses[res.token] = response;
  setTimeout(() => {
    delete responses[res.token];
  }, timeout);
}));

app.post('/', syncronized((req, res, response) => {
  res.set('Content-Type', 'text/xml');
  res.send(response);
}));

const httpsServer = http.createServer({
  key: fs.readFileSync('/etc/letsencrypt/keys/0000_key-certbot.pem', 'utf-8'),
  cert: fs.readFileSync('etc/letsencrypt/live/middleware.bipbop.com.br/fullchain.pem', 'utf-8'),
  ca: [fs.readFileSync('/etc/letsencrypt/live/middleware.bipbop.com.br/chain.pem', 'utf-8')],
}, app).listen(443);
const httpServer = http.createServer(app).listen(80);

httpServer.timeout = timeout;
httpsServer.timeout = timeout;
