var couchapp = require('couchapp'),
path = require('path');

ddoc = { _id:'_design/app'};

ddoc.rewrites = [
    {from: "downloads", to: "posdownload/downloads.html"},
    {from: "admin", to: "rt7_adminPage/rt7_backoffice.html"},
    {from: "login", to: "reporting/report.html"},
    {from: "new/*", to: "../../../*", method : "PUT"},
    {from: "campaigns/*", to: "../../../campaigns/*"},
    {from: "terminals_rt7/*", to: "../../../terminals_rt7/*"},
    {from: "terminals_corp/*", to: "../../../terminals_corp/*"},
    {from: "cashouts/*", to: "../../../cashouts/*"},
    {from: "transactions/*", to: "../../../transactions/*"},
    {from: "cashedout_transactions/*", to: "../../../cashedout_transactions/*"},
    {from: "inventory_rt7/*", to: "../../../inventory_rt7/*"},
    {from: "inventory/*", to: "../../../inventory/*"},
    {from: "inventory_review_rt7/*", to: "../../../inventory_review_rt7/*"},
    {from: "inventory_review_rt7_all_docs", to: "../../../inventory_review_rt7/_all_docs"},
    {from: "inventory_changes/*", to: "../../../inventory_changes/*"},
    {from: "menus_corp/*", to: "../../../menus_corp/*"},
    {from: "menu_buttons/*", to: "../../../menu_buttons/*"},
    {from: "rewards_rt7/*", to: "../../../rewards_rt7/*"},
    {from: "export_requests_rt7/*", to: "../../../export_requests_rt7/*"},
    {from: "vouchers_rt7/*", to: "../../../vouchers_rt7/*"},
    {from: "install_files_rt7/*", to: "../../../install_files_rt7/*"},
    {from: "companies/*", to: "../../../companies/*"},
    {from: "_users/*", to: "../../../_users/*"},
    {from: "users/*", to: "../../../users/*"},
    {from: "locations_rt7/*", to: "../../../locations_rt7/*"},
    {from: "/", to:'reporting/report.html'},
    {from: "/api", to:'../../'},
    {from: "/api/*", to:'../../*'},
    {from: "/*", to:'*'}

];

/*
ddoc.shows = {
    csv:function(doc,req){
	function csvEscapeOnePerLine(arr){
	    var csv = '';
	    var arr_last = arr.length - 1;
	    for(var i = 0; i <= arr_last; i++){
		var value = arr[i].replace(/"/g, '""');
		csv += '"' + value + '"';
		if( i != arr_last ){
		    csv += ";";
		}
	    }
	    return csv;
	}
	if(doc && doc.file_name && doc.date && doc.file_ext){
	    var fileName = doc.file_name + '-' + doc.date +'.'+ doc.file_ext;
	}
	else if(doc && doc.file_name){
	    var fileName = doc.file_name +'.'+ doc.file_ext;
	}
	else{
	    var fileName = 'doc.txt';
	}
	//provides("text", function() {
		     return {
			 "headers" : {
			     'Content-Type' : "text/csv",
			     'Content-Disposition':'attachment; filename='+fileName
			 },
			 "body" : doc.content.map(csvEscapeOnePerLine).join('\n')
		     };
//		 })
    }
};
*/

couchapp.loadAttachments(ddoc, path.join(__dirname, 'attachments'));

module.exports = ddoc;
