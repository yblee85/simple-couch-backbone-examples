var inv_helpers = 
    {renderChangesLog : function(view,id,startPageStr,mainTMP,tableTMP,fetcher){
	 var html = ich[mainTMP](_.extend({startPage:startPageStr},autoBreadCrumb()));
	 $(view.el).html(html);
	 fetcher(id)
	 (function(err,resp_raw){
	      var resp = _.map(resp_raw, function(aitem){
				   var item = _.clone(aitem);
		  		   item.date = dateFormatter(new Date(item.date));
  		           if(_.isDefined(item.price)) {
		  		       item.price.selling_price = currency_format(Number(item.price.selling_price));
		  		   }
				   item.locations = _.filter(item.locations,_.has_F('label'));
		  		   return item;
		  	       });
		  	       
	      var html =  ich[tableTMP]({list:resp});
	      $(view.el).find("#changeLogTable").html(html);
	      //set the buttons to open a dialog list of the stores that apply to each price change
	      _.each(resp,function(item){
			 $("#"+item._id).button().click(
			     function(){
				 item.locations =_(item.locations).chain()
				     .filter(function(item){
						 return (item.label.indexOf(":")!=-1);
					     })
				     .map(function(item){
			     		      var tmp = item.label.split(":");
			     		      return _.extend({},item,{storeName:tmp[1], storeNumber:tmp[0]});
			     		  })
			     	     .value();
				 detailsDialog(ich.simpleList_TMP({items:item.locations}),
					       {title:"changes applied to these locations"});
			     });
		     });
	  });
     },
     renderTaxChangesLog : function(view,id,startPageStr){
	 this.renderChangesLog(view,id,startPageStr,
			       "menuInventoryScanTaxLog_TMP",
			       (startPageStr.indexOf("store")<0)?"menuInventoryScanTaxLogtable_TMP":"menuInventoryScanTaxLogtable_store_TMP",
			       inventoryTaxChangeLog);
     },
     renderPriceChangesLog : function(view,id,startPageStr){
	 this.renderChangesLog(view,id,startPageStr,
			       "menuInventoryScanPriceLog_TMP",
			       (startPageStr.indexOf("store")<0)?"menuInventoryScanPriceLogtable_TMP":"menuInventoryScanPriceLogtable_store_TMP",
			       inventoryPriceChangeLog);
     },

//TODO newItemList should be a backbone collection
//inv_doc should be a backbone model.
//remove allStore_ids
     saveNewInvItems:function(newItemList,origins,allStore_ids){
	 function pushItemForIDs(runAfter){
	     return function(idsToSave){
		 return function(inv_doc){
		     // idsToSave ; {type:"..", location_id:"..", name:"..", number:"..", label:".."}
             // origins ; {type:"..", label:"..", location_id:".."}
		     var generalInvItemData = _.extend({},inv_doc,{date: (new Date()).toString()});
		     var storesInOrigin = _(origins).chain()
                                     .filter(function(item){ 
                                                 return (item.type=="store"); 
                                             })
                                     .value();
                         
            if(storesInOrigin.length>0) {
                var itemsToSave = _.chain(origins)
                                 .mapRenameKeys("id","location_id")
                                 .value();                
            } else {
                var itemsToSave = _.chain(idsToSave)
                                 .concat(origins)
                                 .mapRenameKeys("id","location_id")
                                 .value();
            }
                          

		     // if specific stores only being changed, company shouldn't be changed
		     // TODO : if inventory is new, should be added on inventory_rt7
		     var storesInItems = _(itemsToSave).chain()
                         .filter(function(item){ 
                                     return (item.type=="store"); 
                                 })
                         .value();
		     var sizeStores = _.size(storesInItems);
		     var sizeOfAllStores = _.size(allStore_ids);
                     
		     if(sizeStores == sizeOfAllStores) {
			 var itemsToInventory =  itemsToSave; // include parent
		     } else {
			     var itemsToInventory = storesInItems;
		     }
                     
		     var invModelsToSave = _.map(itemsToInventory,
						 function(item){
						     var invData = _.extend({},generalInvItemData,{locid:item.location_id});
						     var newInv = new InventoryDoc(invData);
						     return newInv;
						 });

		     var newInvChange = new InventoryChangesDoc({inventory : generalInvItemData,
								 ids : itemsToSave});

		     var allModels = invModelsToSave.concat(newInvChange);

		     async.forEach(allModels,
				   function(model,callback){
				       model.save({},{success:function(){callback();}});
				   },
				   runAfter);
		 };
	     };
	 }
	 return function(runAfter){
	     return function(ids){
		 if(_.isEmpty(ids)){}
		 else{
		     _.each(newItemList,pushItemForIDs(runAfter)(ids));
		 }
	     };
	 };
     }
    };