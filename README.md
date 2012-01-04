The Glog Blog
=============

The idea of the Glog Blog was to create a super simple, git and nodejs backed blog that used markdown for formatting.  I find wordpress tremendously cumbersome and wanted to come up with a super simple solution.  Glog is (currently) entierly written in under 350 lines of JavaScript.

### Features
- Git and NodeJS backed
- Simple to setup
- Easy configuration
- Custom URLs
- Disqus and Google Analytic support


### Installation

    $ git clone git clone git@github.com:guyht/Glog.git
    $ cd Glog
    $ git submodule init
    $ git submodule update
    $ cp glog_config.sample.json glog_config.json
    $ vi glog_config.sample.json

- Edit glog_config.sample.json, and rename to glog_config.json
- Set up a github hook to trigger http://yourbloglocation/__render when a new update is pushed
- Run

    `$ node server.js`

Your blog should now be up and running

### The principle

The blog content is stored in a git repository that has the following structure

- An articles folder
- A public folder
- A layout.jade file

**The articles folder** contains blog entries.  Each blog entry consists or a JSON header that defines the author, date, blog entry title, and optionally a custom url. The blog content is written in markdown.  Below is an example.

    {
    	"title" : "A Test Article",
    	"author" : "Guy",
    	"date" : "12/21/2011",
        "url" : "a-test-article"
    }

    This is the content of the post.  You can use markdown to format it, for example, *this text will appear in italic*, **and this will appear in bold**.

**The public folder** contains any css files that are required by the layout.jade template

**The layout.jade file** contains the template for the blog.

The entire blog content is parsed and loaded into memory.  Whenever a new article is published, a git hook triggers the myblog/__render URL which will tell Glog to re-render the blog and update its contents.


### Configuration options
These options should be placed in glog_cofig.json and should be valid JSON

    blog_repository - The url of the blog repository (e.g. git@github.com:guyht/Guido.git)
    author          - The default blog author (will be used if author is not specified in an individual post)
    blog_title      - The title to display at top of the blog
    port            - The port number to run the blog on
    disqus_id       - (Optional) Disqus ID to use for comments
    analytics_code  - (Optional) Google Analytics code
    base_url        - (Optional) Base URL for the blog.  Defaults to '/'

