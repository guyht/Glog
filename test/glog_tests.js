var glog = require('../lib/glog'),
	assert = require('assert'),
	exec = require('child_process').exec;

describe('Glog', function() {

	before(function(done) {
		exec('rm -fr ./blog_repo', function(err, stdout, stderr) {
			done();
		});
	});

	it('should load configs from a JSON file', function(done) {
		glog.load_configs(function(options) {
			assert.equal(options.blog_title, 'The Glog Blog');
			assert.equal(options.port, 8080);
			assert.equal(options.author, 'Glog');
			done();
		});
	});


	it('should be cloned from a remote repository', function(done) {
		glog.load_configs(function(options) {
			glog.get_repo(options.blog_repository, function(err) {
				console .log('err ' + err);
				assert.ok(err);
				done();
			});
		});
	});


	it('should be pulled from a remote repository', function(done) {
		glog.load_configs(function(options) {
			glog.update_repo(options.blog_repository, function(err) {
				assert.ok(err);
				done();
			});
		});
	});


	it('should load articles from the cloned repository', function(done) {
		glog.load_configs(function(options) {
			glog.load_articles(options, function(articles) {
				assert.equal(articles.length, 2);
				done();
			});
		});
	});

	it('should render the articles', function(done) {
		glog.load_configs(function(options) {
			glog.load_articles(options, function(articles) {

				glog.render_blog(options, articles, function() {
					assert.ok(glog.pages['/']);
					done();
				});
			});
		});
	});

});


