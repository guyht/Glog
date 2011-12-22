

var path   = require('path'),
	fs     = require('fs'),
	sys    = require('util'),
	exec   = require('child_process').exec,
	marked = require('marked'),
	connect = require('connect'),
	jade = require('jade'),
	pages = {};


/*exec('cd ' + path.join(__dirname, '../guido') + '; git pull origin master',
		function(error, stdout, stderr) {
			console.log('Stdout: ' + stdout);
			console.log('Stderr: ' + stderr);
			if(error !== null) {
				console.log('exec error: ' + error);
			}
		}
	);


function get_head(cb) {
}
*/

var load_configs = function(cb) {

	var options = {
		repository : '../guido',
		blog_title : 'Glog Blog'
	}

	cb(options);
}


var load_articles = function(options, cb) {

	var articles = [],
		article_path = path.join(options.repository, '/articles');

	console.log('Loading articles from ' + article_path);

	fs.readdir(article_path, function(err, files) {
		if(err) {
			handle_error(err);
		}

		for(var i=0; i<files.length; i++) {
			console.log('Reading file' + files[i]);
			fs.readFile(path.join(article_path, files[i]), 'UTF-8', function(err, data) {
				if(err) {
					handle_error(err);
				}

				// Extract the header
				var parts = data.split('\n\n');
				var header = JSON.parse(parts[0]);
				var body = marked(parts[1]);

				console.log('Read articles with headers: ');
				console.log(header);

				articles.push({
					'title' : header.title,
					'author' : header.author || options.author,
					'filename' : files[i],
					'date' : header.date,
					'body' : body
				});

				// If that was the last article then trigger the callback
				if(files.length === articles.length) {
					cb(articles);
				}

			});
		}
	});
}

var handle_error = function(err) {
	console.error(err);
}

var render_home = function(options, articles) {
	fs.readFile(path.join(options.repository, '/layout.jade'), 'UTF-8', function(err, data) {
		if(err) {
			handle_error(err);
		}

		console.log('Compiling template');
		var fn = jade.compile(data);

		pages['/'] = fn({
			'title': options.blog_title,
			'articles' : articles
		});
	});
};

var render_article = function(req, res, next) {

};

var req_home = function(req, res, next) {
	console.log('Home page requested');
	res.end(pages['/']);
};

var req_article = function(req, res, next) {
	console.log('Requesting ' + req.params.article);
};

load_configs(function(options) {
	load_articles(options, function(articles) {
		articles = articles.sort(function(a,b) {
			return new Date(b.date) - new Date(a.date);
		});
		render_home(options, articles);
	});


	var server = connect.createServer(
		connect.logger(),
		connect.static(path.join(options.repository, '/public')),
		connect.staticCache(),
		connect.router(function(app) {
			app.get('/', req_home);
			app.get('/:article', req_article);
		})
	).listen(8080);

});
