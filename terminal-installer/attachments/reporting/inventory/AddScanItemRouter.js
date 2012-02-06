function getTopLevelId(reportData){
    if(ReportData.company && ReportData.company._id){return ReportData.company._id;}
    else if(ReportData.group && ReportData.group.group_id){return ReportData.group.group_id;}
    else if(ReportData.store && ReportData.store.store_id){return ReportData.store.store_id;}
    else {return undefined;}
};
function getParentsInfo(reportData){
    //makes an object that looks like {company:,group:}
    var company = {
	id:_.either(reportData.company._id,reportData.company_id), 
	label:_.either(reportData.company.companyName,reportData.companyName), 
	type:"company"
    };
    
    if(reportData.group || reportData.group_id){
	var group = {
	    id:_.either(reportData.group_id, reportData.group.group_id), 
	    label:_.either(reportData.group.groupName, reportData.groupName),
	    type:"group"
	};
    }
/*
    var store = {
	id:reportData.store.store_id, 
	label:reportData.store.number+":"+reportData.store.storeName,
	number:reportData.store.storeName,
	type:"store"
    };
*/
    return _.filter$({company:company,group:group},_.isNotEmpty);
};
var menuInventoryaddScanItemRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "menuInventory/companyReportaddScanItem":"menuInventoryCompanyaddScanItem",
		  "menuInventory/groupReportaddScanItem":"menuInventoryGroupaddScanItem",
		  "menuInventory/storeReportaddScanItem":"menuInventoryStoreaddScanItem"
	      },
	      _setup:function(startPage){
		  $("#main").html(ich.inventoryManagementHome_TMP(_.extend({startPage:startPage},autoBreadCrumb())));
		  var invItem = new InventoryDoc();
		  var id = getTopLevelId(ReportData);
		  invItem.cid = id;
		  this.views = [ 
		      new upc_code_input_view({model:invItem}).setElement("#upc"),
		      new inv_display_view({model:invItem}).setElement("#item_display")
		  ];
	      },
	      menuInventoryCompanyaddScanItem:function() {
		  console.log("menuInventoryCompanyaddScanItem");
		  this._setup("companyReport");
	      },
	      menuInventoryGroupaddScanItem:function() {
		  console.log("menuInventoryGroupaddiItem");
		  this._setup("groupReport");
	      },
	      menuInventoryStoreaddScanItem:function() {
		  console.log("menuInventoryStoreaddScanItem");
		  this._setup("storeReport");
	      }
	     }));


var upc_code_input_view = 
    Backbone.View.extend(
	{
	    events:{
		"change":"userChangedUpc"
	    },
	    userChangedUpc:function(){
		var upc = _.str.trim($(this.el).val());
		var view = this;
		var model = view.model;
		model
		    .set({_id:model.cid+"-"+upc},{silent:true})
		    .fetch(
			{
			    success:function(resp_model){
				model.trigger("item_already_in_company",resp_model);
			    },
			    error:function(){
				(new InventoryRT7Doc({_id:upc}))
				    .fetch({success:function(resp_model){
				     		model.clear({silent:true});
						model.set(_(resp_model.toJSON()).selectKeys('description'),{silent:true});
						model.trigger("loaded_from_rt7",model);
					    },
					    error:function(){
						model.clear({silent:true});
						model.trigger("add_item_to_company",model);
					    }});
			    }});
	    }
	}
    );

var inv_display_view = 
    Backbone.View.extend(
	{
	    initialize:function(){
		this.model.on('add_item_to_company',this.addItem,this);
		this.model.on('loaded_from_rt7',this.addItem,this);
		this.model.on("item_already_in_company",this.displayItem,this);
	    },
	    _renderItem:function(model,msg){
		if(msg){var tmpData = _.extend(model.toJSON(),{userMessage:msg});}
		else{var tmpData = model.toJSON();}
		this.$el.html(ich.inventoryForm_TMP(tmpData));
	    },
	    _disableSubmitButton:function(){
		this.$el.find("input,button").attr("disabled", true); 
	    },
	    //todo, need to be able to add to the review DB if the item isn't in rt7 DB
	    addItem:function(model){
		this._renderItem(model,"you can add this item to your inventory");
		$("#addItemToCompany").button().click(
		    function(){
			var formObj = varFormGrabber($("#inv_form"));
			var inv = _.extend(formObj,{upccode:$("#upc").val()});
			var allStores = extractStores(ReportData);
			var allGroups = extractGroups(ReportData);
			var parents = _.values(getParentsInfo(ReportData));
			var locationsToSaveTo = allStores.concat(parents,allGroups);
			//maybe this should be abstracted to a save function
			async.parallel([inv_helpers.modelsFromIds(inv,locationsToSaveTo),
					inv_helpers.changesLogFromModels(inv,locationsToSaveTo)],
				       function(err,modelsToSave){
					   async.forEach(_.flatten(modelsToSave),
							 function(model,cb){
							     model.save({},{success:function(){cb();},error:function(){cb();}});
							 },
							 function(){alert("The Item has been added");});
				       });
		    });
	    },
	    displayItem:function(model){
		this._renderItem(model,"you can not add this item to your inventory, it already exists in it");
		this._disableSubmitButton();
	    }
	}
    );