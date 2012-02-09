function doc_setup() {
    var ts = $("#timespace");
    $(document).everyTime("1s", function() {
        var date = new Date();
        ts.empty();
        ts.append(date.toDateString() + " / " + date.toLocaleTimeString());
    }, 0);
    
    function addItem(viewItem){
	return {success: function(resp){
		    _.extend(resp,{creationdate:new Date()});
		    viewItem.save(resp);}};};

    function editItem(viewItem){
	return {success: function(resp){
		    viewItem.save(resp);}};};

    var AppRouter = new 
    (Backbone.Router.extend(
     {
         routes: {
         "":"inventoryManagementHome",
         "review/":"reviewInventoryHome",
         "add_view/": "addviewInventoryHome",
         "add_view/upc/":"addviewInventoryHome",
         "add_view/upc/:upc": "addmodifyInventory"  
         },
         inventoryManagementHome:function(){
         console.log("inventoryManagementHome");
         var html = ich.inventoryManagementHome_TMP({});
         $("#maininbody").html(html);
         },
         reviewInventoryHome:function(){
            var html = ich.reviewInventoryPage_TMP({});
            $("#maininbody").html(html);
            
            var invCollection = new (couchCollection(
                {db:'inventory_review_rt7'},
                {model:InventoryReviewDoc}));
            
            invCollection.fetch({
                success:function(collection){
                    console.log(collection);
                    var list = _(collection.toJSON()).chain()
                                .sortBy(function(item){return new Date(item.date);})
                                .map(function(item){
                                    _.extend(item,{date:dateFormatter(new Date(item.date))});
                                    return item;            
                                })
                                .value()
                                .reverse();
                    
                    var html = ich.reviewInventoryTable_TMP({list:list});
                    $("#main").html(html);
                },
                error:function(a,b,c) {
                    console.log([a,b,c]);
                }
            });
         },
         addviewInventoryHome:function(){
             var html = ich.addInventoryPage_TMP({});
             $("#maininbody").html(html);
             $("#upc").focus();
            $("#upc")
             .change(function(){
                 var upc = $(this).val();
                 window.location.href ='#add_view/upc/'+_.escape(upc);
                 $(this).focus();
                 $(this).val('');
                 });
         }
     }));
    
    
    var AddViewInventoryView = Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     _.bindAll(view, 'renderManagementPage','renderModifyPage');
	     AppRouter.bind('route:addviewInventoryHome', function(){
				console.log('inventoryView:route:addviewInventoryHome');
                view.el= _.first($("#main"));				
				view.renderManagementPage();});
	     AppRouter.bind('route:addmodifyInventory', function(upc){
				upc = _.unEscape(upc);
				//fetch model based on upc code
				view.el= _.first($("#main"));
				view.model = new InventoryRT7Doc({_id:upc});
				view.model.bind('change',function(){view.renderModifyPage(upc);});
				view.model.bind('not_found',function(){view.renderAddPage(upc);});
				view.model.fetch({error:function(a,b,c){
						      console.log("couldn't load model");
						      view.model.trigger('not_found');
						  }});
				console.log('InventoryView:route:modifyInventory');});
	     
	 },
	 renderManagementPage:function(){
	     var view = this;
	     if(view.model){
		 $(this.el).html("");
	     }
	     $("#upc").focus();
	     console.log("InventoryView renderManagementPage");
	     return this;
	 },
	 renderModifyPage:function(upc){
	     var view = this;
	     var html = ich.inventoryViewPage_TMP(_.extend({upc:upc},view.model.toJSON()));
	     $(html).find('input').attr('disabled',true);
	     $(this.el).html(html);
	     $("#dialog-hook").html(ich.inventoryInputDialog_TMP(_.extend({title:"Edit "+upc+" Information"},view.model.toJSON())));
	     InventoryItemModifyDialog("edit-thing",editItem(view.model));
	     console.log("InventoryView renderModifyPage " + upc);
	     $("#upc").focus();
	     return this;
	 },
	 renderAddPage:function(upc){
	     var view = this;
	     var html = ich.inventoryAddPage_TMP({createButtonLabel:"add (" + upc + ") to the Inventory",upc:upc });
	     $(this.el).html(html);
	     $("#dialog-hook").html(ich.inventoryInputDialog_TMP({title:"Add "+upc+" to the Inventory",_id:upc,location:{},apply_taxes:{},price:{}}));
	     InventoryItemCreateDialog("create-thing",addItem(view.model));
	     $("#upc").focus();
	     console.log("InventoryView renderAddPage " + upc);
	     return this;
	 }
	});

    var InvItemDisplay = new AddViewInventoryView();
    Backbone.history.start();

}
