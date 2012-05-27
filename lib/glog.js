/*
 * Load required modules
 */
var path   = require('path'),
	fs     = require('fs'),
	marked = require('marked'),
	jade   = require('jade'),
	exec   = require('child_process').exec,
	rss    = require('rss');


/*
 * Setup module
 */
module.exports = new Glog();

function Glog() {

	/*
	 * Object variable to track pages
	 */
	this.pages = {};
};

/*
 * Function to handle loading of configs
 */
Glog.prototype.load_configs = function(cb) {

	// Set defaults
	var options = {
			blog_title : 'Glog Blog',
			articles_per_page : 10,
			show_author : false
		},
		fn = this,
		key;

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
			if(path.extname(files[i]) !== '.txt' && path.extname(files[i]) !== '.md') {
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
					cb(articles.reverse());
				}

			});
		}
	});
};


/*
 * Create the RSS feed
 */
Glog.prototype.render_rss = function(options, articles, cb) {

	var feed = new rss({
		title    : options.blog_title,
		feed_url : (options.base_url || '') + '/rss.xml',
		site_url : (options.base_url || ''),
		author   : options.author
		}),
		len = articles.length, i;

	for(i=0;i<len;i++) {
		feed.item({
			title : articles[i].title,
			description : articles[i].body,
			url         : articles[i].url,
			author      : articles[i].author,
			date        : articles[i].date
		});
	}

	this.pages['rss'] = feed.xml();

	cb();

};


/*
 * Render the entire blog and store pages in cache
 */
Glog.prototype.render_blog = function(options, articles, cb) {

	var fn = this;

	fs.readFile(path.join('blog_repo', 'layout.jade'), 'UTF-8', function(err, data) {
		if(err) {
			fn.handle_error('Error loading layout.  Err: ' + err);
		}

		console.log('Compiling template for home page');
		var ja = jade.compile(data),
			per_page = options.articles_per_page,
			i, len = Math.floor((articles.length / per_page) + 1),
			start, end;

		for(i = 0; i < len; i++) {
			start = (per_page * i);
			end = articles.length < (per_page * (i + 1)) ? articles.length : (per_page * (i + 1));

			fn.pages['_page' + (i+1)] = ja({
				'title'          : options.blog_title,
				'analytics_code' : options.analytics_code || null,
				'base_url'       : options.base_url || '',
				'show_author'    : options.show_author,
				'articles'       : articles.slice(start, end),
				'page_num'       : end === articles.length ? -1 : (i+1) // If we are on the last page, pass -1 so we know there are no more pages
			});

			// pages[/] === pages[_page1]
			fn.pages['/'] = fn.pages['_page1'];
		}

		console.log('Compiling template for individual pages');

		// Loop through articles and compile individual pages
		for(var i=0; i< articles.length; i++) {

			fn.pages[articles[i].url] = ja({
				'title'          : articles[i].title,
				'articles'       : [articles[i]],
				'disqus_id'      : options.disqus_id || -1,
				'analytics_code' : options.analytics_code || null,
				'base_url'       : options.base_url || '',
				'show_author'    : options.show_author,
				'single'         : true
			});
		}

		cb();
	});
};


/*
 * Handle a request for the home page
 */
Glog.prototype.req_home = function(req, res, next, options) {
	console.log('Home page requested');

	var pagenum = req.params.pagenum || 1;

	console.log('Rendering page ' + pagenum);

	// Set headers
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('Cache-Control', options.cache_time || 'no-cache');
	res.setHeader('Server', 'Glog (NodeJS)');

	if(typeof this.pages['_page' + pagenum] !== 'undefined') {
		res.end(this.pages['_page' + pagenum]);
	} else {
		res.end(this.pages['/']);
	}
};


/*
 * Handle a request for the RSS feed
 */
Glog.prototype.req_rss = function(req, res, next, options) {
	console.log('RSS feed requested');

	// Set headers
	res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
	res.setHeader('Cache-Control', options.cache_time || 'no-cache');
	res.setHeader('Server', 'Glog (NodeJS)');

	res.end(this.pages['rss']);
};


/*
 * Handle a request for an individual article
 */
Glog.prototype.req_article = function(req, res, next, options) {

	var fn = this,
		url = [req.params.year, req.params.month, req.params.article].join('/');

	console.log('Requesting ' + url);
	if(typeof this.pages[url] === 'undefined') {
		// Set headers
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.setHeader('Cache-Control', options.cache_time || 'no-cache');
		res.setHeader('Server', 'Glog (NodeJS)');
		res.end(this.pages['/']);
	} else {
		// Set headers
		res.setHeader('Content-Type', 'text/html; charset=utf-8');
		res.setHeader('Cache-Control', options.cache_time || 'no-cache');
		res.setHeader('Server', 'Glog (NodeJS)');
		res.end(this.pages[url]);
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
		fn.update_repo(options, function(err) {
			fn.load_articles(options, function(articles) {
				articles = articles.sort(function(a,b) {
					return b.date - a.date;
				});
				fn.render_rss(options, articles, function() {
					fn.render_blog(options, articles, cb);
				});
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
			cb(false);
		}
		console.log('Stdout: ' + stdout);
		console.log('Stderr: ' + stderr);

		cb(true);
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
					cb(false);
				}
				console.log('Stdout: ' + stdout);
				console.log('Stderr: ' + stderr);

				cb(true);
			});
		}
	});
};


/*
 * Format a date
 */
Glog.formatDate = function(date) {
	var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
		months = ['January' , 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
		str;

	str = [days[date.getDay()-1], ', ', date.getDate(), ' ', months[date.getMonth()], ', ', date.getFullYear()].join('');

	return str;

};
