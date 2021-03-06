var menuReportsSalesSummaryRouter = 
    new (Backbone.Router.extend(
	     {routes: {
		  "menuReports/companyReportSalesSummary":"menuReportsCompanySales",
		  "menuReports/groupReportSalesSummary":"menuReportsGroupSales",
		  "menuReports/storeReportSalesSummary":"menuReportsStoreSales"
	      },
	      menuReportsCompanySales:function() {
		  console.log("menuReportsCompanySales  ");
	      },
	      menuReportsGroupSales:function() {
		  console.log("menuReportsGroupSales  ");
	      },
	      menuReportsStoreSales:function() {
		  console.log("menuReportsStoreSales  ");
	      }
	     }));


var menuReportsSalesSummaryView = 
    Backbone.View.extend(
	{initialize:function(){
	     var view = this;
	     view.el = $("#main");
	     
	     _.bindAll(view, 
		       'renderMenuReportsCompanySales',
		       'renderMenuReportsGroupSales',
		       'renderMenuReportsStoreSales');
	     menuReportsSalesSummaryRouter
		 .bind('route:menuReportsCompanySales', 
		       function(){
			   console.log("menuReportsView, route:menuReportsCompanySales");
			   view.renderMenuReportsCompanySales();
		       });
	     menuReportsSalesSummaryRouter
		 .bind('route:menuReportsGroupSales', 
		       function(){
			   console.log("menuReportsView, route:menuReportsGroupSales");
			   view.renderMenuReportsGroupSales();
		       });
	     menuReportsSalesSummaryRouter
		 .bind('route:menuReportsStoreSales',
		       function(){
			   console.log("menuReportsView, route:menuReportsStoreSales");
			   view.renderMenuReportsStoreSales();
		       });
	 },
	 renderMenuReportsCompanySales: function() {
	     
	     var html = ich.salesSummaryReports_TMP({startPage:"companyReport", 
	     					     breadCrumb:breadCrumb(ReportData.company.companyName)});
	     $(this.el).html(html);
	     
	     resetDatePicker();

             resetDropdownBox(ReportData, false, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderSalesSummaryReportTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsGroupSales: function() {
	     
	     var html = ich.salesSummaryReports_TMP({startPage:"groupReport", 
	 					     breadCrumb:breadCrumb(ReportData.companyName,
	 					     			   ReportData.group.groupName)});
	     $(this.el).html(html);
	     
	     resetDatePicker();
	     
             resetDropdownBox(ReportData, false, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderSalesSummaryReportTable();
			});
	     
	     console.log("rendered general report");
	 },
	 renderMenuReportsStoreSales: function() {
	     
	     var html = ich.salesSummaryReports_TMP({startPage:"storeReport", 
	 					     breadCrumb:breadCrumb(ReportData.companyName,
	 					     			   ReportData.groupName,
	 					     			   ReportData.store.storeName,
	 					     			   ReportData.store.number)});
	     $(this.el).html(html);
	     
	     resetDatePicker();
	     
             resetDropdownBox(ReportData, false, true);
	     
	     var btn = $('#generalgobtn')
		 .button()
		 .click(function(){
			    renderSalesSummaryReportTable();
			});
	     
	     console.log("rendered general report");
	 }
	});

/********************************************* helper functions ***************************************/

function renderSalesSummaryReportTable() {
    console.log("renderSalesSummaryReportTable");
    var groupdown = $("#groupsdown");
    var storedown = $("#storesdown");

    if(!_.isEmpty($("#dateFrom").val()) && !_.isEmpty($("#dateTo").val())) {
	var startDate = new Date($("#dateFrom").val());
	var endDate = new Date($("#dateTo").val());
	var endDateForQuery = new Date($("#dateTo").val());
	endDateForQuery.addDays(1);
	
	var ids = [];
	
	if(storedown.val()=="ALL") {
	    _.each($('option', storedown), function(option){ if(option.value!=="ALL"){ids=ids.concat(option.value);}});
	} else {
	    ids = ids.concat(_.isEmpty(storedown.val())?ReportData.store.store_id:storedown.val());
	}
	
	//TODO : args need to be changed ; children ids, parent id, startData, endData, callback
	//		 so that this function will give back list items and total info
	cashoutFetcher_Period(ids,startDate,endDateForQuery,
			      function(a,for_TMP){
	      			  console.log(for_TMP);
	      			  var data_TMP = extractSalesSummaryTableInfo(for_TMP);
	      			  
	      			  var html = ich.salesSummarytable_TMP(data_TMP);
				  $("#summarytable").html(html);
			      });
    } else {
   	alert("Input Date");
    }
};

function extractSalesSummaryTableInfo(list) {
    function getGroupName(groups, store_id) {
	var name="";
	_.each(groups, function(group){
		   name = !_(group.stores).chain()
		       .pluck("store_id")
		       .filter(function(id){return id==store_id;})
		       .isEmpty()
		       .value()? group.groupName:name;
	       });
	return name;
    };
    
    function getStoreNameNum(groups, store_id) {
	var namenum ={name:"",num:""};
	_.each(groups, function(group){
		   _.each(group.stores, function(store){
			      namenum.name = store.store_id==store_id?store.storeName:namenum.name;
			      namenum.num = store.store_id==store_id?store.number:namenum.num;
			  });
	       });
	return namenum;
    };
    
    function getSummarySales(item) {
    	return {
	    numberoftransactions:(Number(item.noofsale)+Number(item.noofrefund))+"",
	    sales:toFixed(2)(Number(item.netsales)-Number(item.netrefund)),
	    tax1:toFixed(2)(Number(item.netsaletax1)-Number(item.netrefundtax1)),
	    tax3:toFixed(2)(Number(item.netsaletax3)-Number(item.netrefundtax3)),
	    totalsales:toFixed(2)(Number(item.netsaleactivity)),
	    cash:toFixed(2)(Number(item.cashpayment)-Number(item.cashrefund)),
	    credit:toFixed(2)(Number(item.creditpayment)-Number(item.creditrefund)),
	    debit:toFixed(2)(Number(item.debitpayment)-Number(item.debitrefund)),
	    mobile:toFixed(2)(Number(item.mobilepayment)-Number(item.mobilerefund)),
	    other:toFixed(2)(Number(item.otherpayment)-Number(item.otherrefund))
	};
    };
    
    //TODO : don't calculate here, ask server
    function appendTotals(inputs) {
	var input = _.clone(inputs);
	var total={};
	
	total.totalsales = currency_format(_(input.list).chain()
					   .pluck('summary')
					   .reduce(function(init,item){ return Number(item.sales)+init;},0)
					   .value())
	;

	total.totaltransactions=_(input.list).chain()
	    .pluck('summary')
	    .reduce(function(init,item){ return Number(item.numberoftransactions)+init;},0)
	    .value();
	total.totaltax1 = currency_format(_(input.list).chain()
					  .pluck('summary')
					  .reduce(function(init,item){ return Number(item.tax1)+init;},0)
					  .value());
	total.totaltax3 = currency_format(_(input.list).chain()
					  .pluck('summary')
					  .reduce(function(init,item){ return Number(item.tax3)+init;},0)
					  .value());
	total.totaltotalsales = currency_format(_(input.list).chain()
						.pluck('summary')
						.reduce(function(init,item){ return Number(item.totalsales)+init;},0)
						.value());
	total.totalcash = currency_format(_(input.list).chain()
					  .pluck('summary')
					  .reduce(function(init,item){ return Number(item.cash)+init;},0)
					  .value());
	total.totalcredit = currency_format(_(input.list).chain()
					    .pluck('summary')
					    .reduce(function(init,item){ return Number(item.credit)+init;},0)
					    .value());
	total.totaldebit = currency_format(_(input.list).chain()
					   .pluck('summary')
					   .reduce(function(init,item){ return Number(item.debit)+init;},0)
					   .value());
	total.totalmobile = currency_format(_(input.list).chain()
					    .pluck('summary')
					    .reduce(function(init,item){ return Number(item.mobile)+init;},0)
					    .value());
	total.totalother = currency_format(_(input.list).chain()
					   .pluck('summary')
					   .reduce(function(init,item){ return Number(item.other)+init;},0)
					   .value());
	input.total = total;
	return input;
    };
    
    var result = {};
    
    if(!_.isEmpty(ReportData.company)) {
	var groups = ReportData.company.hierarchy.groups;
	result.list = _.map(list, function(item){
				var period = item.period;
				var namenum = getStoreNameNum(groups,item.id);
				return {groupName:getGroupName(groups,item.id),
					storeName:namenum.name,
					storeNumber:namenum.num,
					summary:getSummarySales(period)
				       };
			    });
	
	
	result = appendTotals(result);
	
	result.list = _.map(result.list, function(item){
				_.applyToValues(item.summary, function(obj){
						    var strObj = obj+"";
						    if(strObj.indexOf(".")>=0) {
					     		obj = currency_format(Number(obj));
						    }
						    return obj;
						}, true);
				return item;
			    });
	
	return result;
	
    } else if(!_.isEmpty(ReportData.group)) {
	var groups = [ReportData.group];
	result.list = _.map(list, function(item){
				var period = item.period;
				var namenum = getStoreNameNum(groups,item.id);
				return {groupName:getGroupName(groups,item.id),
					storeName:namenum.name,
					storeNumber:namenum.num,
					summary:getSummarySales(period)
				       };
			    });
	
	
	result = appendTotals(result);
	
	result.list = _.map(result.list, function(item){
				_.applyToValues(item.summary, function(obj){
						    var strObj = obj+"";
						    if(strObj.indexOf(".")>=0) {
					     		obj = currency_format(Number(obj));
						    }
						    return obj;
						}, true);
				return item;
			    });
	
	return result;
	
    } else if(!_.isEmpty(ReportData.store)) {
	result.list = _.map(list, function(item){
				var period = item.period;
				return {groupName:ReportData.groupName,
					storeName:ReportData.store.storeName,
					storeNumber:ReportData.store.number,
					summary:getSummarySales(period)
				       };
			    });
	
	
	result = appendTotals(result);
	
	result.list = _.map(result.list, function(item){
				_.applyToValues(item.summary, function(obj){
						    var strObj = obj+"";
						    if(strObj.indexOf(".")>=0) {
					     		obj = currency_format(Number(obj));
						    }
						    return obj;
						}, true);
				return item;
			    });
	
	return result;
    }
};