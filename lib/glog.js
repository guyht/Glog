/*
 * Load required modules
 */
var path   = require('path'),
	fs     = require('fs'),
	marked = require('marked'),
	jade = require('jade'),
	exec  = require('child_process').exec;

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
		},
		fn = this;

	fs.readFile(path.join('glog_config.json'), 'UTF-8', function(err, data) {
		if(err) {
			fn.handle_error('Could not load configuration file.  This should be named glog_config.json. Err: ' + err);
		}

		var configs = JSON.parse(data);

		// Check mandatory configs
		if(!configs.port) {
			fn.handle_error('port is not defined in glog_config.json.  This should be set to the port number you wish the blog to run on');
			process.exit();
		}

		if(!configs.blog_repository) {
			fn.handle_error('blog_repository is not defined in glog_config.json.  This should point to the git repository of the blog content');
			process.exit();
		}

		if(!configs.author) {
			fn.handle_error('author is not defined in glog_config.json.  This should be the default blog author');
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
		article_path = path.join('blog_repo', '/articles'),
		fn = this;

	console.log('Loading articles from ' + article_path);

	fs.readdir(article_path, function(err, files) {
		if(err) {
			fn.handle_error('Could not read articles directory.  Please make sure paths are set up correctly.  Err: ' + err);
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
					fn.handle_error('Error reading article.  Err: ' + err);
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
					fn.handle_error('Articles must have a title');
					cb(false);
					return;
				}

				if(!header.date) {
					fn.handle_error('Articles must have a date');
					cb(false);
					return;
				}

				// Extract date
				var date = new Date(header.date),
					year = date.getFullYear(),
					month = date.getMonth() + 1; // Month is + 1 as starts at 0

				// If month < 10 prepend a 0
				if(month < 10) {
					month = ['0', month].join('');
				}

				articles.push({
					'title'    : header.title,
					'author'   : header.author || options.author,
					'date'     : date,
					'date_str' : Glog.formatDate(date),
					'year'     : year,
					'month'    : month,
					'body'     : body,
					'url'      : [year, month, (header.url || header.title.replace(/\s/g, '-'))].join('/')
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

	var fn = this;

	fs.readFile(path.join('blog_repo', 'layout.jade'), 'UTF-8', function(err, data) {
		if(err) {
			fn.handle_error('Error loading layout.  Err: ' + err);
		}

		console.log('Compiling template for home page');
		var fn = jade.compile(data);

		pages['/'] = fn({
			'title'    : options.blog_title,
			'articles' : articles
		});

		console.log('Compiling template for individual pages');

		// Loop through articles and compile individual pages
		for(var i=0; i< articles.length; i++) {

			pages[articles[i].url] = fn({
				'title'          : options.blog_title,
				'articles'       : [articles[i]],
				'disqus_id'      : options.disqus_id || -1,
				'analytics_code' : options.analytics_code || null,
				'single'         : true
			});
		}
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

	var fn = this,
		url = [req.params.year, req.params.month, req.params.article].join('/');

	console.log('Requesting ' + url);
	if(typeof pages[url] !== 'undefined') {
		// Set headers
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.setHeader('Cache-Control', 'max-age=2592000');
		res.setHeader('Server', 'Glog (NodeJS)');
		res.end(pages[url]);
	} else {
		// Set headers
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.setHeader('Cache-Control', 'max-age=2592000');
		res.setHeader('Server', 'Glog (NodeJS)');
		res.end(pages['/']);
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
	var fn = this,
		next;

	fn.load_configs(function(options) {
		fn.update_repo(options, function() {
			fn.load_articles(options, function(articles) {
				articles = articles.sort(function(a,b) {
					return b.date - a.date;
				});
				fn.render_blog(options, articles);

				cb(options);
			});
		});
	});
};


/*
 * Clone a blog git repository
 */
Glog.prototype.get_repo = function(repo, cb) {

	var fn = this;

	// Attempt to clone the git repo
	console.log('Cloning git repository ' + repo);
	exec('git clone ' + repo + ' blog_repo', function(error, stdout, stderr) {
		if(error) {
			fn.handle_error('Could not clone git repository: ' + error);
		}
		console.log('Stdout: ' + stdout);
		console.log('Stderr: ' + stderr);

		cb();
	});
};


/*
 * Update git repository
 */
Glog.prototype.update_repo = function(options, cb) {

	var fn = this;

	// If repo does not exist, clone it
	fs.stat('blog_repo', function(err, stats) {
		if(err) {
			fn.handle_error(err);
		}

		if(err || !stats.isDirectory()) {
			fn.get_repo(options.blog_repository, cb);
		} else {

			console.log('Updating blog git repo');
			exec('cd blog_repo; git pull origin master', function(error, stdout, stderr) {
				if(err) {
					fn.handle_error('Could not update blog repo: ' + error);
				}
				console.log('Stdout: ' + stdout);
				console.log('Stderr: ' + stderr);

				cb();
			});
		}
	});
};


Glog.formatDate = function(date) {
	var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
		months = ['January' , 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		str;

	str = [days[date.getDay()], ', ', date.getDate(), ' ', months[date.getMonth()], ', ', date.getFullYear()].join('');

	return str;

};
