var assert = require('assert'),
    exec = require('child_process').exec;

describe('Glog', function() {

    before(function(done) {
        exec('rm -fr ./blog_repo', function(err, stdout, stderr) {
            done();
        });
    });

    it('should load configs from a JSON file', function(done) {
        var glog = require('../lib/glog');
        glog.load_configs(function(options) {
            assert.equal(options.blog_title, 'The Glog Blog');
            assert.equal(options.port, 8080);
            assert.equal(options.author, 'Glog');
            done();
        });
    });


    it('should be cloned from a remote repository', function(done) {
        var glog = require('../lib/glog');
        glog.load_configs(function(options) {
            glog.get_repo(options.blog_repository, function(err) {
                console .log('err ' + err);
                assert.ok(err);
                done();
            });
        });
    });


    it('should be pulled from a remote repository', function(done) {
        var glog = require('../lib/glog');
        glog.load_configs(function(options) {
            glog.update_repo(options.blog_repository, function(err) {
                assert.ok(err);
                done();
            });
        });
    });


    it('should load articles from the cloned repository', function(done) {
        var glog = require('../lib/glog');
        glog.load_configs(function(options) {
            glog.load_plugins(options, function(err) {
                glog.load_articles(options, function(articles) {
                    assert.equal(articles.length, 3);
                    done();
                });
            });
        });
    });

    it('should render the articles', function(done) {
        var glog = require('../lib/glog');
        glog.load_configs(function(options) {
            glog.load_articles(options, function(articles) {
                glog.render_blog(options, articles, function() {
                    assert.ok(glog.pages['/']);
                    done();
                });
            });
        });
    });

    it('should handle plugins', function(done) {
        var glog = require('../lib/glog');
        glog.load_configs(function(options) {
            options.plugins.push("example");
            glog.load_plugins(options, function(){
                glog.load_articles(options, function(articles) {
                    glog.render_blog(options, articles, function() {
                        assert.equal(articles[0].title, 'Title changed by plugin');
                        assert.equal(articles[0].year, '1988');
                        done();
                    });
                });
            });
        });
    });

    it('default to show on home page', function(done) {
        var glog = require('../lib/glog');
        glog.load_configs(function(options) {
            glog.load_plugins(options, function(){
                glog.load_articles(options, function(articles) {
                    glog.render_blog(options, articles, function() {
                        assert.equal(articles[0].show_on_home_page, false);
                        assert.equal(articles[1].show_on_home_page, true);
                        done();
                    });
                });
            });
        });

    });

});


