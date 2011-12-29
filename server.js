var glog = require('./lib/glog'),
	connect = require('connect'),
	path = require('path');


glog.rebuild(function(options) {

	console.log('Starting server on port ' + options.port);

	var server = connect.createServer(
		connect.static(path.join('blog_repo', '/public')),
		connect.staticCache(),
		connect.router(function(app) {
			app.get('/', glog.req_home);
			app.get('/__render', function(req, res, next) {
				glog.rebuild(function(options) {
					res.end();
				});
			});
			app.post('/__render', function(req, res, next) {
				glog.rebuild(function(options) {
					res.end();
				});
			});
			app.get('/:year/:month/:article', glog.req_article);
		})
	).listen(options.port);
});
