var glog = require('./lib/glog'),
    express = require('express'),
    path = require('path');


glog.rebuild(function() {
    glog.load_configs(function(options) {

        console.log('Starting server on port ' + options.port);

        var server = express.createServer(
            express.static(path.join('blog_repo', '/public')),
            express.staticCache(),
            express.router(function(app) {
                app.get('/__render', function(req, res, next) {
                    glog.rebuild(function() {
                        res.end();
                    });
                });
                app.post('/__render', function(req, res, next) {
                    glog.rebuild(function() {
                        res.end();
                    });
                });
                app.get('/', function(req, res, next) {
                           glog.req_home(req, res, next, options)
                    });
                app.get('/page/:pagenum', function(req, res, next) {
                           glog.req_home(req, res, next, options)
                    });
                app.get('/:year/:month/:article', function(req, res, next) {
                           glog.req_article(req, res, next, options)
                    });
                app.get('/rss.xml', function(req, res, next) {
                           glog.req_rss(req, res, next, options)
                    });
                app.get('/*', function(req, res, next) {
                           glog.req_home(req, res, next, options)
                    });
            })
        ).listen(process.env.VCAP_APP_PORT || options.port);
    });
});
