[![Build Status](https://secure.travis-ci.org/guyht/Glog.png)](http://travis-ci.org/guyht/Glog)

### Upgrading to version 2x
As of version 2, Glog is using the [node-config](https://github.com/lorenwest/node-config) module to handle configuration.  While this is a step forward for Glog, allowing you to easily fine tune configuration for your environments, it means that the name and location of the config file has changed.  See the configuration section below.

The Glog Blog
=============

The idea of the Glog Blog was to create a super simple, Git and Node.js backed blog that used markdown for formatting.  I find Wordpress tremendously cumbersome and wanted to come up with a super simple solution.  Glog is (currently) entirely written in under 350 lines of JavaScript.

# Features
- Git and Node.js backed
- Simple to setup
- Easy configuration
- Custom URLs
- Disqus and Google Analytic support


# Installation

    $ git clone git@github.com:guyht/Glog.git
    $ cd Glog
	$ npm install
    $ cp glog_config.sample.json glog_config.json
    $ vi glog_config.sample.json

- Edit glog_config.sample.json, and rename to glog_config.json
- Set up a github hook to trigger http://yourbloglocation/__render when a new update is pushed
- Run

    `$ node server.js`

Your blog should now be up and running

# Guido

Guido ([https://github.com/guyht/Guido](https://github.com/guyht/Guido)) is the default template for Glog.  It consists of a simplistic layout and a couple of examples to get you going.  I suggest that you use it as a starting point (i.e. fork it) for your own blog.  The glog_config.json file contains the Guido repository as a default.

# The principle

The blog content is stored in a git repository that has the following structure

    /
    |
    +- layout.jade
    |
    +- articles/
    |  |
    |  +- article-1.txt
    |  |
    |  +- article-2.txt
    |
    +- public/
       |
       +- main.css

**The articles folder** contains blog entries.  Each blog entry consists or a JSON header that defines the author, date, blog entry title, and optionally a custom url. The blog content is written in markdown.  Below is an example.

    {
    	"title"  : "A Test Article",
    	"author" : "Guy",
    	"date"   : "12/21/2011",
        "url"    : "a-test-article"
    }

    This is the content of the post.  You can use markdown to format it,
    for example, *this text will appear in italic*, **and this will appear in bold**.

You could then add your new blog entry as follows

    $ git add articles/a-test-article.txt
    $ git commit -m "Added new article: A Test Article"
    $ git push origin master

If your git hook is setup correctly, the changes will automatically be pushed to your Glog blog!

**The public folder** contains any css files that are required by the layout.jade template

**The layout.jade file** contains the template for the blog.

The entire blog content is parsed and loaded into memory.  Whenever a new article is published, a git hook triggers the myblog/__render URL which will tell Glog to re-render the blog and update its contents.


# Configuration options
Glog has recently switched to using [node-config](https://github.com/lorenwest/node-config).  This new library makes handling different configuration for different environments a breze.  To get you up and running, the following instructions are all you need, but if you would like to setup different configurations for different environments, take a peek at the node-config documentation.

These options should be placed in config/default.json (the default configuration file) and should be valid JSON

    blog_repository  - The url of the blog repository (e.g. git@github.com:guyht/Guido.git)
    author           - The default blog author (will be used if author is not specified in an individual post)
    blog_title       - The title to display at top of the blog
    port             - The port number to run the blog on
    disqus_id        - (Optional) Disqus ID to use for comments
    analytics_code   - (Optional) Google Analytics code
    base_url         - (Optional) Base URL for the blog.  Defaults to '/'
	cache_time       - (Optional) Time in seconds to cache each page
	article_per_page - (Optional) Number of articles to display on a page. Defaults to 10
	show_author      - (Optional) Display the author name in the article title.  Defaults to false

# Running the tests

    $ make test

# Plugins
Glog contains a simple plugin system which allows 3rd party software to modify the content and meta data of the articles.

To install a plugin, simply place the plugin file in the ./plugins directory and add the following to you config.json file:

    ...
    plugins : [
      'myplugin'
    ]
    ....

Glog will handle the rest.

### Writing plugins
Writing a plugin is also very simple.  Your plugin should expose a 'load' function whch accepts a 'glog' object.  The glog object contains a set of hooks (currenlty only *registerArticleHook*) which take as an argument a function that is passed an articles object and a callback.  Simply make your modifications to the articles object and invoke the callback passing errors and the articles object as arguments.

A simple plugin might look like this:

    module.exports.load = function(glog) {
        glog.registerArticleHook(function(articles, cb) {
            for(var i=0;i<articles.length;i++) {
                articles[i].title = 'Title changed by plugin';
            }
            cb(null, articles);
        });
    }

