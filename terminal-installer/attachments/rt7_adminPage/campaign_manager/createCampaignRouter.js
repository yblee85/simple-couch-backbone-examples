var testData = {
    _id: "AllCanadaAllTerminal",
    _rev: "3-ed84300839289e02a0084409f1f6df06",
    name: "AllCanadaAllTerminal",
    time: {
	end: "2011-12-31T00:00:00.000-05:00",
	start: "2011-10-07T00:00:00.000-04:00"
    },
    description: "test description",
    advertiser: "test advertiser",
    salesperson: "test sales person",
    presentation_type: "captive",
    all_times: false,
    all_days: false,
    locations : [
	{country: 'Canada'} 
    ],
    days_and_hours: [
	{
            time: {
		end: "2011-10-07T17:02:00.000-04:00",
		start: "2011-10-07T16:10:00.000-04:00"
            },
            day: "FRI"
	},
	{
            time: {
		end: "2011-10-07T17:02:00.000-04:00",
		start: "2011-10-07T16:10:00.000-04:00"
            },
            day: "THU"
	},
	{
            time: {
		end: "2011-10-07T13:03:00.000-04:00",
		start: "2011-10-07T16:10:00.000-04:00"
            },
            day: "THU"
	}
    ],
    for_terminals_created_before: new Date(),

    images: [
	{
            file: "C:\\Users\\4\\Documents\\01\\CANADA.jpg"
	},
	{
            file: "C:\\Users\\4\\Documents\\02\\CANADA.jpg"
	}
    ],
    _attachments: {
	"C:\\Users\\4\\Documents\\02\\CANADA.jpg": {
            content_type: "image/jpeg",
            revpos: 3,
            digest: "md5-MesMX0p/a4Qa8Ltv7Dya7Q==",
            length: 105361,
            stub: true
	},
	"C:\\Users\\4\\Documents\\01\\CANADA.jpg": {
            content_type: "image/jpeg",
            revpos: 2,
            digest: "md5-UiP6U6RJISdaRc4N5Sfh1Q==",
            length: 125957,
            stub: true
	}
    }
};

function no_op(){};
function extractFormData(){
    return form2object("testForm", '.', true, nodeProcessor);}
function basicAutoComplete(view,db,input){
    groupQuery(view,db,1)
    (function(data){
	 var keys = extractKeys(data);
	 var DOM_element = "#"+input;
	 $(DOM_element).autocomplete({source:keys,
				      delay:0,
				      change:function(){
					  $(DOM_element).trigger('change');
				      },
				      select:function(e,ui){
					  $(DOM_element).val(ui.item.value);
					  $(DOM_element).trigger('change');
				      }
				     });
     });
};

function transform_campaign_for_form(camp){
    function create_for_terminals_field(camp){
	if(camp.for_terminals_created_before){
	    camp._for_terminals = "current";
	}
	else{camp._for_terminals = "future";}
	return camp;
    }
    function move_all_terminals_field(camp){
	if(!camp.locations){return camp;}
	var locations = camp.locations;
	function detectAllTerminalsObj(obj){return (!_.isUndefined(obj.all_terminals));}
	var all_terminals = _.detect(locations,detectAllTerminalsObj);
	if(all_terminals){
	    camp._all_terminals = all_terminals.all_terminals;
	    camp.locations = _.reject(locations,detectAllTerminalsObj);
	}
	return camp;
    }
    function transform_days_and_hours(camp){
	//holy shit compress duplicate times and concat the days into an array
	var grouped = _(camp.days_and_hours).chain()
	    .groupBy(function(obj){return new Date(obj.time.start).getTime() +
				   ":" +
				   new Date(obj.time.end).getTime();})
	    .value();
	var dateRanges = _.keys(grouped);
	camp.days_and_hours =  _(grouped).chain()
	    .keys()
	    .map(function(dateRange){return _.pluck(grouped[dateRange],'day');})
	    .zip(dateRanges)
	    .map(function(days_time_pair){
		     var days = _.first(days_time_pair);
		     var times = _.last(days_time_pair).split(":").map(Number);
		     var start = new Date(_.first(times));
		     var end = new Date(_.last(times));
		     return {day : days, time: {start :start ,end : end}};
		 })
	    .value();
	return camp;
    }

    function transform_countries(camp){
	camp.countries = _(camp.locations).chain().pluck('country').unique().value();
	return camp;
    }
    var transformations = _.compose(create_for_terminals_field, 
				    move_all_terminals_field,
				    transform_days_and_hours,
				    transform_countries);
    return transformations(camp);
}
function finalSetup(){
    var transformedData = transform_campaign_for_form(testData);
    console.log(transformedData);

    function transformer(obj,$node){
	if(!obj){return obj;}
	var varType = $node.attr('var_type');
	if(varType){
	    switch (varType){
	    case "date":{return new Date(obj);}
	    case "time":{
		var d = new Date(obj);
		var hours = d.getHours();
		var minutes = d.getMinutes();
		if(minutes < 10){minutes = "0" + minutes;}
		return hours + ":" + minutes;}
	    }
	}
	return obj;
    };

    //add days_and_hours selectors so data can be entered into them from the fetched doc
    //_(transformedData.days_and_hours.length).chain().range().each(function(){ $('#btnAdd').trigger('click');});
    
    //$("#for_terminals_created_before").val(new Date()); //for creating new compaigns
    var $formElements = $("#campaignForm").find('[name]');
    console.log($formElements);
    populateForm($formElements,transformedData,'name',transformer);
    console.log("done processing final setup");
};
var regionSelectorSettings = {
    minWidth:700,
    selectedList: 6,
    click: multiselectRefresh,
    checkAll:multiselectRefresh,
    uncheckAll:multiselectRefresh,
    optgroupToggle:multiselectRefresh,
    refresh: multiselectRefresh,
    position: {
	my: 'left bottom',
	at: 'left top'
    },
    selectedText: function(numChecked, numTotal, checkedItems){
	if(numChecked == numTotal){
	    return "ALL";
	}
	return checkedItems
	    .reduce(function(sum,cur){
			if(sum == ""){
			    return cur.title;    
			}
			return sum + "," + cur.title;
		    },"");
    }
};
function multiselectRefresh(trigger,whatisthis){
    console.log("multiselectRefresh");
    switch(trigger.target.id){
    case "countries": {updatedParentChildSelect($("#countries")); break;}
    case "provinces": {updatedParentChildSelect($("#provinces")); break;}
    case "cities": {updatedParentChildSelect($("#cities")); break;}
    }
};
function updatedParentChildSelect(parentNode){
//parent child does not refer to a visible hiarchy it more closely resembles members of a list
// 
//    var parentSelect = "provinces";
//    var childSelect = "cities";
//    var queryPath = ["Canada","Ontario"]; //query path needs to be calculated each time used

   // var parentNode = $("#"+parentSelect);
    var childNode = parentNode.nextAll('select').first();
    var parentSelect = parentNode.attr('id');
    var childSelect = childNode.attr('id');




    //add or remove entries from the povinces select group
    console.log('updated '+ parentSelect);
    var stores_db = cdb.db('terminals_rt7');
    var reigion_v = cdb.view('app/country_prov_city_postal_code_short');

    //REMOVE country optgroups from provinces select
    parentNode
	.multiselect('getUnChecked')
	.each(function(){
		  var parentLabel = $(this).val();
		  var childOptGrps = childNode.find('optgroup').filter('[label='+parentLabel+']');
		  if(!_.isEmpty(childOptGrps)){
		      childOptGrps.remove();
		      console.log("removed an option from: " + childSelect);
		      //if something get's unchecked, then it needs to referberate through the entire selection list
		      //this is currently not happening.
		      childNode.multiselect('refresh');
		  }
		});

    //ADD parentLabel/childLabel to child select
    parentNode
	.multiselect('getChecked')
	.filter(function(){
		    //only select countries that aren't already in the provinces optgroups
		    var parentLabel = $(this).val();
		    var childOptGrps = childNode.find('optgroup').filter('[label='+parentLabel+']');
		    return childOptGrps.empty();
		})
	.each(function(){
		  var parentLabel = $(this).val(); 
		  console.log("updating "+childSelect+" for "+ parentSelect + " -> " + parentLabel);
		  function queryPath(startNode, label){
		      var previousNode = startNode.prevAll('select').first();
		      var parentLabel;
		      if(previousNode.length === 0){
			  parentLabel = label;
		      }
		      else{
			  parentLabel = $(startNode).find('[value='+label+']').first().parent().attr('label');
		      }
		      if(previousNode.length === 0){
			  return [parentLabel];
		      }
		      return queryPath(previousNode,parentLabel).concat(label);
		  }
		  function extractOptGrpOptionPairFromMultiSelect(node){
		      var optionLabel = node.val();
		      return optionLabel;
		  }
		  var startingPoint = extractOptGrpOptionPairFromMultiSelect($(this));
		  var query = queryPath(parentNode,startingPoint);
		  peekingQuery(reigion_v,stores_db,query) //FIXME query path wrong
		  (function(data){
		       var keys = extractKeys(data);
		       var groupedByParent = _(keys)
			   .chain()
			   .map(function(item){
				   // var lastPair = (_.size(item) == 2)?item:_.last(item,2);
				    var lastPair = _.last(item,2);
				    var parent = _.first(lastPair);
				    var child = _.last(lastPair);
				    return {parentLabel:parent,childLabel:child};})
			   .groupBy(function(item){ return item.parentLabel; })
			   .value();
		       console.log("find which " +  childSelect + " to add to select");
		       var forTMP = {optGroups: _(groupedByParent)
				     .chain()
				     .keys()
				     .tap(console.log)
				     .map(function(parentLabel){
					      var optGroupLabel = parentLabel;
					      var options = _.map(groupedByParent[parentLabel],
								  function(item){
								      var value = item.childLabel, label = item.childLabel;
								      return {value:value,label:label};});
					      return {label:optGroupLabel,options:options};
					  })
				     .value()
				    };
		       if(!_.isEmpty(forTMP.optGroups)){
			   console.log(forTMP);
			   var optionsToAdd = ich.optionGroup_TMP(forTMP);
			   console.log(optionsToAdd);
			   childNode.append(optionsToAdd);
			   //may want to use _.after here
			   childNode.multiselect('refresh');
		       }
		       console.log("done updating "+ childSelect);
		   });

	      });
};
function countriesSetup(view,db){
    groupQuery(view,db,1)
    (function(data){
	 var TMP_data = {list :_.map(extractKeys(data),function(item){return {value:item,label:item};})};
	 var options = ich.options_TMP(TMP_data);
	 $('#countries').append(options);
	 var select = $('#countries');
	 select.multiselect(
	     _.extend(regionSelectorSettings,{ noneSelectedText:"Countries"}));
	 //FIXME:don't know if this works or not (NOT WORKING)
	 //select.multiselect().bind('refresh',updatedCountries);
	 console.log("done setting up countries");

	 provincesSetup(view,db);	     
     });
};

function provincesSetup(view,db){
    var select = $('#provinces');
    select.multiselect(
	_.extend(regionSelectorSettings,{ noneSelectedText:"Provinces/States"}));
    console.log("done setting up provinces");
    citiesSetup();
};
function citiesSetup(view,db){
    var select = $('#cities');
    select.multiselect(
	_.extend(regionSelectorSettings,{ noneSelectedText:"Cities"}));
    console.log("done setting up cities");
    postalCodeSetup();
};
function postalCodeSetup(view,db){
    //FIXME should be select + input
    var select = $('#postalCodes');
    select.multiselect(
	_.extend(regionSelectorSettings,{ noneSelectedText:"Postal/Zip codes"}));
    console.log("done setting up postalCodes");
    finalSetup();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

function inputDaysHoursInfoDialog(options) {
    var d = $("#dialog-hook");
    d.html(options.html);

    var dialogOptions = _.extend(
    {autoOpen: false,
     height: 390,
     width: 350,
     modal: true,
     buttons: {
             "Submit": function() {
         var f = d.find("form");
         var dayhourInfo = varFormGrabber(f);
         options.success(dayhourInfo);
         d.dialog('close');
             },
             "Close": function() {
         d.dialog('close');
             }
     },
     title:options.title
    },
    _.clone(options));

    d.dialog(dialogOptions);
    d.dialog("open");
};

var days_and_hours_table_view =
    Backbone.View.extend({
        render:function(list){
        var view = this;
        var for_TMP = _(list).chain()
                        .clone()
                        .map(function(item){
                            return {
                                _id:_.indexOf(list,item),
                                day:item.day,
                                startTime: (new Date(item.time.start)).toLocaleTimeString(),
                                endTime:(new Date(item.time.end)).toLocaleTimeString()
                            };
                        })
                        .value();
        console.log(for_TMP);
        template = view.options.template;
        el = view.$el;
        html = ich[template]({list:for_TMP});
        el.html(html);
        _.each(for_TMP,function(item){
            $("#del-"+item._id).button();
        });
        }
    });
    
var days_and_hours_view =
    Backbone.View.extend({
        initialize:function() {
            var view = this;
            view.day_time_table = new days_and_hours_table_view({template:'daySelectionTable_TMP'});
            view.list_days_hours = [];
            //view.list_days_hours.on('change', function...);
        },
        events:{
        'click #btnAdd':'show_dialog',
        'click #chkalldaysandhours' : 'check_all_days_hours',
        'click .del' : 'delete_days_hours'
        },
        setup:function() {
            var view = this;
            view.$el.find('input:button').button();
            view.day_time_table.setElement('#days_and_hours_table');
            view.day_time_table.render(view.list_days_hours);
            this.trigger("update_list");
        },
        dialog_setup:function(html) {
            //TODO : there will be a better way
            $(html).find(".startTime").first()
               .timepicker({
                   timeOnly: true,
                   showButtonPanel: false
               });
             $(html).find(".endTime").first()
               .timepicker({
                   timeOnly: true,
                   showButtonPanel: false
               });
           
           $(html).find(".checkAlldays").first()
           .click(function(){
               var btn = this;
               $(html).find(".checkDay")
                   .each(function(){
                       $(this).attr('disabled',$(btn).prop('checked'));
                   });
           });
               
           $(html).find('.checkAlltimes').first()
           .click(function(){
               var btn = this;
              if($(btn).prop('checked')){
                  var times = $(html).find('.startTime, .endTime');
                  times.filter('.startTime').val('00:00');
                  times.filter('.endTime').val('23:59');
                  
              }
              $(html).find('.startTime, .endTime')
              .each(function(){
                    $(this).attr('disabled',$(btn).prop('checked'));
                });
              });
        },
        show_dialog:function(){
            var view = this;
            var html = ich.daySelectionDialog_TMP({});
            var options = {html:html, title:"input day/hour"};
            view.dialog_setup(html);
            inputDaysHoursInfoDialog(_.extend(options,view.addDays_Hours()));
        },
        check_all_days_hours:function(event) {
            var view = this;
            var chk24_7 = $("#"+event.currentTarget.id);
            if(chk24_7.is(":checked")) {
                view.delete_all_list();
                $("#days_and_hours_table").hide();
                $("#btnAdd").attr("disabled",true);
            } else {
                $("#days_and_hours_table").show();
                $("#btnAdd").attr("disabled",false);
            }
        },
        addDays_Hours:function() {
            var view = this;
            function transformListData(formData){
                function getDateObjectFromTimeString(timeString){
                    var strTimeList = (timeString.trim()).split(":");
                    var currentDate = new Date();
                    return new Date(currentDate.getFullYear(), 
                                    currentDate.getMonth(), 
                                    currentDate.getDate(),
                                    Number(strTimeList[0]),
                                    Number(strTimeList[1]),
                                    0); 
                };
                var keys = _.keys(formData.days); //MON ~ SUN
                if(formData.all_days==true) {
                    _.each(keys,function(key){
                        formData.days[key] = true;
                    });
                }
                var startTimeJSON = getDateObjectFromTimeString(formData.time.start).toJSON();
                var endTime = getDateObjectFromTimeString(formData.time.end);
                endTime.setSeconds(59);
                var endTimeJSON = endTime.toJSON();
                return _(keys).chain()
                        .map(function(key){
                            if(formData.days[key]) {
                                return {
                                    day:key,
                                    time:{
                                        start:startTimeJSON,
                                        end:endTimeJSON
                                    }
                                };
                            } else {
                                return undefined;
                            }
                        })
                        .compact()
                        .value();
            };
            return {
                success:function(formData){
                    console.log(formData);
                    var convertedList = transformListData(formData);
                    console.log(convertedList);
                    view.list_days_hours = view.list_days_hours.concat(convertedList);
                    view.day_time_table.render(view.list_days_hours);
                    view.update_list_in_router();                    
                },
                error:function() {
                    
                }
            };
        },
        delete_days_hours:function(event) {
            //alert("del clicked. id:" + event.currentTarget.id);
            var view = this;
            var indexId = (event.currentTarget.id).replace("del-","");
            view.list_days_hours = _.reject(view.list_days_hours,function(item){
                return item == view.list_days_hours[Number(indexId)];
            });
            view.day_time_table.render(view.list_days_hours);
            view.update_list_in_router();  
        },
        delete_all_list:function() {
            var view = this;
            view.list_days_hours = [];
            view.day_time_table.render(view.list_days_hours);
            view.update_list_in_router();    
        },
        update_list_in_router:function() {
            this.trigger("update_list");
        }
    });

var location_and_company_view =
    Backbone.View.extend({
        initialize:function() {
            var view = this;
            view.listLocationsCompany = [];
            view.locationsTree=[];
            //view.day_time_table = new days_and_hours_table_view({template:'daySelectionTable_TMP'});
            //view.list_days_hours = [];
            //view.list_days_hours.on('change', function...);
        },
        events:{
        'click a':'click_A'
        },
        setup:function() {
            var view = this;
            $.couch.db("terminals_rt7").view("app/country_prov_city_area_postal_code_company", {
                success:function(resp) {
                    function transformListToTree(listLocCom) {
                        function appendTree(tree,item) {
                            function getEmptyObj(propertyName){
                                switch(propertyName){
                                    case "country":
                                        return {name:"default",province:[{name:"default",city:[{name:"default",areaCode:[{name:"default",postalCode:[{name:"default"}]}]}]}]};
                                    case "province":
                                        return {name:"default",city:[{name:"default",areaCode:[{name:"default",postalCode:[{name:"default"}]}]}]};
                                    case "city":
                                        return {name:"default",areaCode:[{name:"default",postalCode:[{name:"default"}]}]};
                                    case "areaCode":
                                        return {name:"default",postalCode:[{name:"default"}]};
                                    case "postalCode":
                                        return {name:"default"};
                                };
                            };
                            var foundCountry = _.find(tree,function(treeItem){ 
                                return treeItem.name==item.country;
                            });
                            
                            if(_.isEmpty(foundCountry)) {
                                var newCountry = getEmptyObj("country");
                                newCountry.name=item.country;
                                newCountry.province[0].name = item.province;
                                newCountry.province[0].city[0].name = item.city;
                                newCountry.province[0].city[0].areaCode[0].name = item.areaCode;
                                newCountry.province[0].city[0].areaCode[0].postalCode[0].name = item.postalCode;
                                tree = tree.concat(newCountry);
                                return tree;
                            } else {
                                var foundProvince = _.find(foundCountry.province, function(treeItem){
                                    return treeItem.name==item.province;
                                });
                                
                                if(_.isEmpty(foundProvince)) {
                                    var newProvince = getEmptyObj("province");
                                    newProvince.name = item.province;
                                    newProvince.city[0].name = item.city;
                                    newProvince.city[0].areaCode[0].name = item.areaCode;
                                    newProvince.city[0].areaCode[0].postalCode[0].name = item.postalCode;
                                    foundCountry.province = foundCountry.province.concat(newProvince);
                                    return tree;
                                } else {
                                    var foundCity = _.find(foundProvince.city, function(treeItem){
                                        return treeItem.name==item.city;
                                    });
                                    
                                    if(_.isEmpty(foundCity)) {
                                        var newCity = getEmptyObj("city");
                                        
                                        newCity.name = item.city;
                                        newCity.areaCode[0].name = item.areaCode;
                                        newCity.areaCode[0].postalCode[0].name = item.postalCode;
                                        foundProvince.city = foundProvince.city.concat(newCity);
                                        return tree;
                                    } else {
                                        var foundArea = _.find(foundCity.areaCode, function(treeItem){
                                            return treeItem.name==item.areaCode;
                                        });
                                        
                                        if(_.isEmpty(foundArea)) {
                                            var newArea = getEmptyObj("areaCode");
                                            
                                            newArea.name = item.areaCode;
                                            newArea.postalCode[0].name = item.postalCode;
                                            foundCity.areaCode = foundCity.areaCode.concat(newArea);
                                            return tree;
                                        } else {
                                            ///
                                            var foundPostal = _.find(foundArea.postalCode, function(treeItem){
                                                return treeItem.name==item.postalCode;
                                            });
                                            
                                            if(_.isEmpty(foundPostal)) {
                                                var newPostal = getEmptyObj("postalCode");
                                                
                                                newPostal.name = item.postalCode;
                                                foundArea.postalCode = foundArea.postalCode.concat(newPostal);
                                                return tree;
                                            } else {
                                                return tree;    
                                            }        
                                        }        
                                    }    
                                }
                            }
                        };
                        
                        //TODO
                        
                        var tree = _.reduce(listLocCom, appendTree, []);
                        console.log("aaaa");
                        console.log(tree);
                        return tree;
                    };
                    
                    var keys = _.pluck(resp.rows,"key");
                    console.log(keys);
                    view.listLocationsCompany = _.map(keys,function(listLocCom){
                        return {
                            country:listLocCom[0],
                            province:listLocCom[1],
                            city:listLocCom[2],
                            areaCode:listLocCom[3],
                            postalCode:listLocCom[4],
                            company:listLocCom[5]
                        };
                    });
                    
                    var tree = transformListToTree(view.listLocationsCompany);
                    console.log(tree);
                    var html = ich.locations_tree_TMP({country:tree});
                    $("#locationstree").html(html);
                    $("#locationstree").jstree();
                    
                },
                error:function() {
                    alert("Error occured. please, try again");
                },
                reduce:false
            });
        },
        click_A:function(event){
            alert("click a");
        }
    });

var createCampaignRouter =
    new (Backbone.Router.extend(
             {routes: {
              "createcampaigns":"_setup"
              },
              initialize:function() {
                var router = this;
                router.startDate = (new Date());
                router.endDate = (new Date()).addDays(1);
                router.list_days_hours=[];
                router.views = {
                    start_date_picker : new date_picker_view({date:router.startDate}),
                    end_date_picker : new date_picker_view({date:router.endDate}),
                    days_and_hours : new days_and_hours_view(),
                    location_and_company : new location_and_company_view()
                };
                router.views.start_date_picker.on('date-change',router.update_start_date,router);
                router.views.end_date_picker.on('date-change',router.update_end_date,router);
                router.views.days_and_hours.on('update_list',router.update_list_days_hours,router);
              },
              _setup:function(){
                console.log("campaign manager");
                var router = this;
                $("#main").html(ich.createCampaign_TMP({}));
                //FIXME : enable fileselection, sometimes it throws error
                MultiFileSetup(); 
                
                router.views.start_date_picker.setElement("#dateFrom").setup();
                router.views.end_date_picker.setElement("#dateTo").setup();
                router.views.days_and_hours.setElement("#days_and_hours").setup();
                router.views.location_and_company.setElement("#location_and_company").setup();
                
                var stores_db = cdb.db('terminals_rt7');
                var reigion_v = cdb.view('app/country_prov_city_postal_code');
            
                //setup logic (chained callbacks)
                countriesSetup(reigion_v,stores_db);//(provincesSetup(reigion_v,stores_db)(function(){console.log("done");}));
                //  (provincesSetup(reigion_v,stores_db)
                //     (finalSetup));
          
          
              },              
              update_start_date:function(date) {
                  this.startDate = date;    
              },
              update_end_date:function(date) {
                  this.endDate = date;
              },
              update_list_days_hours:function() { // TODO : abundant. i don't even know why i made this, maybe i want every info in this router.
                  this.list_days_hours = this.views.days_and_hours.list_days_hours;
              }
              }));
