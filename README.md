The Glog Blog
=============

The idea of the Glog Blog was to create a super simple, git and nodejs backed blog that used markdown for formatting.  I find wordpress tremendously cumbersome and wanted to come up with a super simple solution.  Glog is (currently) entierly written in under 250 lines of JavaScript.


The blog content is stored in a git repository that has the following structure

- An articles folder
- A public folder
- A layout.jade file

**The articles folder** contains blog entries.  Each blog entry consists or a JSON header that defines the author, date, and blog entry title, and then the blog content that is written in markdown.  Below is an example.

    {
    	"title" : "A Test Article",
    	"author" : "Guy",
    	"date" : "12/21/2011"
    }

    This is the content of the post.  You can use markdown to format it, for example, *this text will appear in italic*, **and this will appear in bold**.

**The public folder** contains any css files that are required by the layout.jade template

**The layout.jade file** contains the template for the blog.

The entire blog content is parsed loaded into memory.  Whenever a new article is published, a git hook triggers the myblog/__render URL which will tell Glog to re-render the blog and update its contents.

Installation
============

Setup your blog repository.  The recommended method is as follows:

- Fork http://github.com/guyht/guido.

- Set up a github hook to trigger http://yourbloglocation/__render when a new update is pushed

- Download the latest tag, then run

    npm install

in the glog root directory.  This will install the required additional modules.

- Edit glog_config.sample.json, and rename to glog_config.json.

- Run

    node server.js

Et voila
