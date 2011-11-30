function typedTransactionRangeQuery(view,db,base){
    return function(startDate,endDate){
	var startKey = base.concat(startDate);
	var endKey = base.concat(endDate);
	var options = {
	    reduce:true,
	    group_level:_.size(endKey),
	    startkey:startKey,
	    endkey:endKey
	};
	return queryF(view,db)(options);
    };
};

function relative_dates(){
    return {
	today : _.first(Date.today().toArray(),3),
	tomorrow : _.first(Date.today().addDays(1).toArray(),3),
	yesterday : _.first(Date.today().addDays(-1).toArray(),3),
	startOfMonth : _.first(Date.today().moveToFirstDayOfMonth().toArray(),3),
	startOfYear : _.first(Date.today().moveToMonth(0,-1).moveToFirstDayOfMonth().toArray(),3)
    };
};

function returnQuery(callback){
    return function(query){
	callback(null, query);
    };
};

function generalSalesReportFetcher(view,db,id,runAfter){
    var companySalesBaseKey = [id];
    var companySalesRangeQuery = typedTransactionRangeQuery(view,db,companySalesBaseKey);

    function extractTotalSales(salesData,refundData){
	function sum(total,cur){
	    return total + cur.value.sum;
	}
	var sales = 0;
	_.isFirstNotEmpty(salesData.rows)? sales = _.first(salesData.rows).value.sum: sales = 0;
	return sales;
    }
    var d = relative_dates();
    async
	.parallel(
	    {yesterdaysSales:function(callback){companySalesRangeQuery(d.yesterday,d.today)(returnQuery(callback));},
	     monthsSales:function(callback){companySalesRangeQuery(d.startOfMonth,d.tomorrow)(returnQuery(callback));},
	     yearsSales:function(callback){companySalesRangeQuery(d.startOfYear,d.tomorrow)(returnQuery(callback));}
	    },
	    function(err,report){
		var sales = {};
		sales.yesterdaysales= extractTotalSales(report.yesterdaysSales,report.yesterdaysRefunds).toFixed(2);
		sales.mtdsales = extractTotalSales(report.monthsSales,report.monthsRefunds).toFixed(2);
		sales.ytdsales = extractTotalSales(report.yearsSales,report.yearsRefunds).toFixed(2);
		runAfter({sales:sales});	  
	    });
};

function generalCashoutReportFetcher(view,db,id,runAfter){
    var companySalesBaseKey = [id];
    var companySalesRangeQuery = typedTransactionRangeQuery(view,db,companySalesBaseKey);
    var d = relative_dates();
    async
	.parallel(
	    {yesterday:function(callback){companySalesRangeQuery(d.yesterday,d.today)(returnQuery(callback));},
	     month:function(callback){companySalesRangeQuery(d.startOfMonth,d.tomorrow)(returnQuery(callback));},
	     year:function(callback){companySalesRangeQuery(d.startOfYear,d.tomorrow)(returnQuery(callback));}
	    },
	    function(err,report){
		var cashouts = {};
		
		cashouts.yesterday = (_.first(report.yesterday.rows)? _.first(report.yesterday.rows).value:CashoutFormatData);
		cashouts.mtd = (_.first(report.month.rows)? _.first(report.month.rows).value:CashoutFormatData);
		cashouts.ytd = (_.first(report.year.rows)? _.first(report.year.rows).value:CashoutFormatData);

		var totalyesterday = cashouts.yesterday['menusalesamount'] + cashouts.yesterday['scansalesamount'] + cashouts.yesterday['ecrsalesamount'];
		var totalmtd = cashouts.mtd['menusalesamount'] + cashouts.mtd['scansalesamount'] + cashouts.mtd['ecrsalesamount'];
		var totalytd = cashouts.ytd['menusalesamount'] + cashouts.ytd['scansalesamount'] + cashouts.ytd['ecrsalesamount'];

/*		
		var yesterdaytotal = _(cashouts.yesterday).chain()
		    .selectKeys(['menusalesamount', 'scansalesamount', 'ecrsalesamount'])
		    .flatten()
		    .reduce(function (init, amount){
				return init + amount;}, 0)
		    .value();
*/		
		
		cashouts.yesterday = appendCategorySalesPercent(totalyesterday, cashouts.yesterday);
		cashouts.mtd = appendCategorySalesPercent(totalmtd, cashouts.mtd);
		cashouts.ytd = appendCategorySalesPercent(totalytd, cashouts.ytd);
		
		runAfter(cashouts);	  
	    });
};

function generalSalesReportArrayFetcher(view,db,ids,runAfter){
    async.map(ids, 
	      function(id,callback){
		  generalSalesReportFetcher(view,db,
					    id,
					    function(salesData){
						callback(null,salesData);
					    });
	      },
	      runAfter);
};

function generalCashoutReportArrayFetcher(view,db,ids,runAfter){
    async.map(ids, 
	      function(id,callback){
		  generalCashoutReportFetcher(view,db,
					      id,
					      function(salesData){
						  callback(null,salesData);
					      });
	      },
	      runAfter);
};

function transactionsSalesFetcher(ids,callback){
    var transactionsView = cdb.view('reporting','netsaleactivity');
    var transaction_db = cdb.db('cashouts');
    if(!_.isArray(ids)){
	return generalSalesReportFetcher(transactionsView,transaction_db,ids,callback);
    }
    else{
	return generalSalesReportArrayFetcher(transactionsView,transaction_db,ids,callback);
    }
};

function cashoutFetcher(ids,callback){
    var transactionsView = cdb.view('reporting','cashouts_id_date');
    var transaction_db = cdb.db('cashouts');
    if(!_.isArray(ids)){
	return generalCashoutReportFetcher(transactionsView,transaction_db,ids,callback);
    }
    else{
	return generalCashoutReportArrayFetcher(transactionsView,transaction_db,ids,callback);
    }
};

function appendCategorySalesPercent(total, obj) {
    var cashout = _.clone(obj);
    if(total!=0) {
	cashout.menusalespercent = (cashout.menusalesamount / total*100).toFixed(2);
	cashout.ecrsalespercent = (cashout.ecrsalesamount / total*100).toFixed(2);
	cashout.scansalespercent = (cashout.scansalesamount / total*100).toFixed(2);
    } else {
	cashout.menusalespercent = 0.00;
	cashout.ecrsalespercent = 0.00;
	cashout.scansalespercent = 0.00;
    }
    return cashout;
}
