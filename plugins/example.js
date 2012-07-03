
/*
 * Example plugin for Glog
 *
 * This is a very basic plugin example which changes the
 * title of each article and also makes a variable called plugin_var
 * available to the template.
 */

module.exports.load = function(glog) {
    glog.registerPostArticleHook(function(articles, cb) {
        for(var i=0;i<articles.length;i++) {
            articles[i].title = 'Title changed by plugin';
        }
        cb(null, articles);
    });
    glog.registerPreArticleHook(function(articles, cb) {
      for(var i=0;i<articles.length;i++){
        articles[i].year = '1988'
      }
      cb(null, articles);
    });
}
