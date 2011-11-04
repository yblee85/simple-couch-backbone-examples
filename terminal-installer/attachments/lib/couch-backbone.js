var campaignList;

//FIXME: not working right... also should be assigning an ID if one doesn't exist
/*The POST operation can be used to create a new document with a server generated DocID. To do so, the URL must point to the database's location. To create a named document, use the PUT method instead. 
 * */
var couchDoc = Backbone.Model.extend(
    {
	idAttribute: "_id",
	save:function(attrs,options){
	    function updateRev(model,resp,status){
		model.set({_rev:status.rev},{silent: true});
	    };
	    options || (options = {});
	    var model = this;
	    var success = options.success;   
	    options.success = function(resp, status, xhr) {
		if (success){success(model, resp, status);}
		updateRev(model,resp,status);
	    };
	    Backbone.Model.prototype.save.call(this, attrs, options);
	}	
    });
/*to use this function you need to have the following rewrites in your design doc
 * 	     {from:"/db", to:'../../_all_docs',query:{include_docs:"true"}},
	     {from:"/db/*", to:'../../*'},
 couch = {db:,ddoc} they are names referring to the names of the database and ddoc
 options =  what you would normally use in .extend()... if you overwrite url,parse, or other things that couchCollection use it will probably not work right
 */
var couchCollection = function(couch,options){
    couch || (couch = {});
    couch.ddoc || (couch.ddoc = "app");
    couch.db || (couch.db = 'db');
    options || (options = {});
    //fixme: this doesn't work because when creating a new model it will fetch the whole collection! lawl!
    var urlBase = window.location.protocol + "//" + window.location.hostname + ":" +window.location.port + "/";
    var urlSuffix = "/_design/"+couch.ddoc+"/_rewrite/db";
    return Backbone.Collection.extend(
	_.extend(options,
		 {url:urlBase + couch.db + urlSuffix,
		  parse: function(response) {
		      return _(response.rows).chain()
			  .reject(function(item){return item.id.search('_design') == 0;}) //reject design docs
			  .pluck('doc')
			  .value();
		  }
		 }));
};

