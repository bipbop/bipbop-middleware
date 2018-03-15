const timeout = 60 * 60 * 1000;
const BIPBOP_FREE = '6057b71263c21e4ada266c9d4d4da613';
const cheerio = require('cheerio');
const async = require('async');
const requestPromise = require('request-promise');
const prettyMs = require('pretty-ms');
const Promise = require('bluebird');

const cheerioOptions = {
  normalizeWhitespace: true,
  xmlMode: true,
};

module.exports = function syncronized(drain) {
  return (req, res) => {
    const $ = cheerio.load('<?xml version="1.0" encoding="UTF-8"?><middleware></middleware>', cheerioOptions);

    const middleware = $('middleware');

    if (!req.body.requests || !req.body.requests.length) {
      res.set('Content-Type', 'text/xml');
      res.send($.xml());
      return;
    }

    const start = Date.now();
    const threads = parseInt(req.body.threads, 10);
    const queue = async.queue(
      (task, callback) => Promise.resolve(requestPromise({
        uri: 'https://irql.bipbop.com.br/',
        method: 'POST',
        form: Object.assign({}, task.form, {
          suppressHTTPCode: 'true',
          apiKey: req.body.apiKey || BIPBOP_FREE,
        }),
      }))
        .tap(() => console.log(`Iniciando: ${task.id}`))
        .then((request) => {
          const $request = cheerio.load(request, cheerioOptions);
          middleware.append($request.xml($request('*').first().attr('id', task.id)));
        })
        .catch(err => middleware.append($('<error />').attr('id', task.id).text(err.toString())))
        .finally(() => callback()),
      (threads || 5) > 20 ? 20 : threads,
    );

    queue.drain = () => {
      middleware.attr('elapsed-time-ms', prettyMs(Date.now() - start));
      middleware.attr('jobs', req.body.requests.length.toString());
      drain(req, res, $.xml());
    };

    setTimeout(() => queue.kill(), timeout);
    queue.push(req.body.requests);
  };
};
