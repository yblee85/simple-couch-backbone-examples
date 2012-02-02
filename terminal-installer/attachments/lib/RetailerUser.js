var urlBase = window.location.protocol + "//" + window.location.hostname + ":" +window.location.port + "/";
var RetailerUserDoc = couchDoc.extend({urlRoot:urlBase + "layered_login_users"});
var RetailerUserCollection = Backbone.Collection.extend({
    model : RetailerUserDoc
});

function fetchRetailerUserCollection(id) {
    return function(callback){
            queryF(cdb.view("app","lowestlevel_id_doc"), cdb.db("layered_login_users"))
            ({key:id})
            (function(response){
                 var user_collection = new RetailerUserCollection();
                 _.reduce(response.rows, function(collection,item){
                     return collection.add(item.value, {silent:true});
                 },user_collection);
                 callback(null,user_collection);
             });
    };
};