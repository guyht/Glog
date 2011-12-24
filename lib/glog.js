/*
 * Load required modules
 */
var path   = require('path'),
	fs     = require('fs'),
	marked = require('marked'),
	jade = require('jade');

/*
 * Scope variable to cache pages
 */
var pages = {};


/*
 * Setup module
 */
module.exports = new Glog();

function Glog() {};

/*
 * Function to handle loading of configs
 */
Glog.prototype.load_configs = function(cb) {

	// Set defaults
	var options = {
		blog_title : 'Glog Blog'
	}

	fs.readFile(path.join('glog_config.json'), 'UTF-8', function(err, data) {
		if(err) {
			handle_error('Could not load configuration file.  This should be named glog_config.json. Err: ' + err);
		}

		var configs = JSON.parse(data);

		// Check mandatory configs
		if(!configs.port) {
			handle_error('port is not defined in glog_config.json.  This should be set to the port number you wish the blog to run on');
			process.exit();
		}

		if(!configs.repository) {
			handle_error('repository is not defined in glog_config.json.  This should point to the git repository of the blog content');
			process.exit();
		}

		if(!configs.author) {
			handle_error('author is not defined in glog_config.json.  This should be the default blog author');
			process.exit();
		}

		for(key in configs) {
			options[key] = configs[key];
		}

	cb(options);
	});

}


/*
 * Load the articles from disc and add them to an array
 */
Glog.prototype.load_articles = function(options, cb) {

	var articles = [],
		article_path = path.join(options.repository, '/articles');

	console.log('Loading articles from ' + article_path);

	fs.readdir(article_path, function(err, files) {
		if(err) {
			handle_error('Could not read articles directory.  Please make sure paths are set up correctly.  Err: ' + err);
		}

		// Remove incorrect extensions
		for(var i=0; i<files.length; i++) {
			if(path.extname(files[i]) !== '.txt') {
				console.log('Skipping file ' + files[i] + '  Incorrect extension');
				files.splice(i,1);
			}
		}


		for(var i=0; i<files.length; i++) {
			console.log('Reading file ' + files[i]);

			fs.readFile(path.join(article_path, files[i]), 'UTF-8', function(err, data) {
				if(err) {
					handle_error('Error reading article.  Err: ' + err);
				}

				// Extract the header
				var parts = data.split('\n\n');
				var header = JSON.parse(parts[0]);
				parts.splice(0,1);
				var body = marked(parts.join('\n\n'));

				console.log('Read articles with headers: ');
				console.log(header);

				// Check mandatory fields
				if(!header.title) {
					handle_error('Articles must have a title');
					cb(false);
					return;
				}

				if(!header.date) {
					handle_error('Articles must have a date');
					cb(false);
					return;
				}

				articles.push({
					'title' : header.title,
					'author' : header.author || options.author,
					'date' : header.date,
					'body' : body,
					'url' : header.url || header.title.replace(/\s/g, '-')
				});
				// If that was the last article then trigger the callback
				if(files.length === articles.length) {
					cb(articles);
				}

			});
		}
	});
}


/*
 * Render the entire blog and store pages in cache
 */
Glog.prototype.render_blog = function(options, articles) {
	fs.readFile(path.join(options.repository, '/layout.jade'), 'UTF-8', function(err, data) {
		if(err) {
			handle_error('Error loading layout.  Err: ' + err);
		}

		console.log('Compiling template for home page');
		var fn = jade.compile(data);

		pages['/'] = fn({
			'title': options.blog_title,
			'articles' : articles
		});

		console.log('Compiling template for individual pages');

		// Loop through articles and compile individual pages
		for(var i=0; i< articles.length; i++) {

			pages[articles[i].url] = fn({
				'title': options.blog_title,
				'articles' : [articles[i]]
			});
		}

		// Render 404
		pages['__404'] = fn({
			'title' : options.blog_title,
			'articles' : [],
			'__404' : true
		});
	});
};


/*
 * Handle a request for the home page
 */
Glog.prototype.req_home = function(req, res, next) {
	console.log('Home page requested');

	// Set headers
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('Cache-Control', 'max-age=2592000');
	res.setHeader('Server', 'Glog (NodeJS)');
	res.end(pages['/']);
};


/*
 * Handle a request for an individual article
 */
Glog.prototype.req_article = function(req, res, next) {
	console.log('Requesting ' + req.params.article);
	if(typeof pages[req.params.article] !== 'undefined') {
		// Set headers
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.setHeader('Cache-Control', 'max-age=2592000');
		res.setHeader('Server', 'Glog (NodeJS)');
		res.end(pages[req.params.article]);
	} else {
		this.req_home(req, res, next);
	}
};


/*
 * Generic error handler
 */
Glog.prototype.handle_error = function(err) {
	console.error(err);
}


/*
 * Function to trigger a build of the entire site
 */
Glog.prototype.rebuild = function(cb) {
	var fn = this;

	fn.load_configs(function(options) {
		fn.load_articles(options, function(articles) {
			articles = articles.sort(function(a,b) {
				return new Date(b.date) - new Date(a.date);
			});
			fn.render_blog(options, articles);

			cb(options);
		});
	});
};


