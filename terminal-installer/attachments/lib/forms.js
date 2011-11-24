//relies on jquery.js, underscore.js

function jsPather(pathStr){
    //converts js obj notation into a path array
    // "obj.var.var1" -> ["obj","var","var1"]
    return pathStr
	.replace(/\[/g,'.')
	.replace(/\]/g,'')
	.split(".");
};

function assignFromPath(obj,travel,assignVal){
    var prop = _.first(travel);
    //walks a path defined by an array of fields, assigns a value to the last field walked
    //creates a path if one does not exist
    if(_.isEmpty(travel)){
	obj = assignVal;
	return obj;
    }
    else if(obj && !obj[prop]){
	obj[prop] = {};
    }
    if(!obj){return null;}
    obj[prop] = assignFromPath(obj[prop],_.rest(travel),assignVal);
    return obj; 
};

function formGrabber($form,varName){
    //grabs the values from a form where each field is labeled in the form of a js object notation
    return _($form.find('['+varName+']'))
	.chain()
	.map(function(el) {
		 //make a list of [obj.prop.prop..., value]
		 var $el = $(el);
		 if($el.is(':checkbox')){
		     return [jsPather($el.attr(varName)),$el.is(':checked')];
		 }
		 return [jsPather($el.attr(varName)),$el.val()];
	     })
	.reduce(function(obj,cur_keyVal){
		    //consume the path-value list and make the object it represents
		    var path = _.first(cur_keyVal);
		    var valueToAssign = _.last(cur_keyVal);
		    obj = assignFromPath(obj,path,valueToAssign);
		    return obj;
		},{})
	.value();
};