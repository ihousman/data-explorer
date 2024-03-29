
function sortFunction(a, b) {
    if (a[0] === b[0]) {
        return 0;
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}
function downloadURI() {
	if(uri != null && uri != undefined){
	  var link = document.createElement("a");
	  link.download = uriName + '.png';
	  link.href = uri;
	  link.click();
	  // document.body.removeChild(link);
	    delete link;
}}
function clearSelectedAreas(){
    $('.selected-features-list').empty();
    Object.keys(selectedFeaturesJSON).map(function(k){
        selectedFeaturesJSON[k].geoJSON.forEach(function(f){
        	var name = f.h.selectionTrackingName;
			console.log(name);
            delete selectedFeaturesJSON[k].rawGeoJSON[name]
        	selectedFeaturesJSON[k].geoJSON.remove(f)
        });
    })
    $('#selected-features-area').html('>0 hectares / 0 acres');
    selectedFeatures = undefined;
    selectedFeaturesNames = undefined;
    updateSelectedAreaArea();
}
function getSelectedAreasNameList(includeFeatureCollectionName){
	if(includeFeatureCollectionName === null || includeFeatureCollectionName === undefined){includeFeatureCollectionName = true}
	var nameList = [];
	Object.keys(selectedFeaturesJSON).map(function(k){
		selectedFeaturesJSON[k].geoJSON.forEach(function(f){
			if(includeFeatureCollectionName){
				var n = k+' - ' +f.h.selectionTrackingName;
			}else{
				var n = f.h.selectionTrackingName;
			}
			nameList.push(n)
		})
	})
	return nameList
}
function updateSelectedAreasNameList(){
	var nameList = getSelectedAreasNameList();
	// console.log(nameList);
	$('#selected-features-list').empty();
	nameList.map(function(nm){
		$('#selected-features-list').append(`<ul class = 'select-layer-name'>${nm}</ul>`)
	})
	

}
function getSelectedGEEFeatureCollection(){
	var selectedGEEFeatureCollection = [];
	Object.keys(selectedFeaturesJSON).map(function(k){
		Object.keys(selectedFeaturesJSON[k].rawGeoJSON).map(function(kk){
			var f = selectedFeaturesJSON[k].rawGeoJSON[kk];
			selectedGEEFeatureCollection.push(ee.Feature(f))
		})
	})
	return ee.FeatureCollection(selectedGEEFeatureCollection)
}
function removeLastSelectArea(){
	try{
		var k = $('li .select-layer-name').last().html().split(' - ')[0];
		// $('li .select-layer-name').last().remove();
		
		// selectedFeatures = selectedFeatures.limit(selectedFeatures.size().subtract(1));

		var l = 0;var i = 0;
		selectedFeaturesJSON[k].geoJSON.forEach(function(f){l++});
		selectedFeaturesJSON[k].geoJSON.forEach(function(f){
			if(i == l-1){
				var name = f.h.selectionTrackingName;
				console.log(name);
                delete selectedFeaturesJSON[k].rawGeoJSON[name];
				selectedFeaturesJSON[k].geoJSON.remove(f);
			}
			i++
			});
		// var selectedFeaturesNamesList = selectedFeaturesNames.split(' - ');
		var selectedFeaturesNamesList = getSelectedAreasNameList();
		updateSelectedAreasNameList();
		// if(selectedFeaturesNamesList.length <2){
		// 	// selectedFeaturesNames = '';
		// 	clearSelectedAreas();
		// }else{
		// 	// selectedFeaturesNames = selectedFeaturesNames.split(' - ').slice(0,-1).join(' - ');
		updateSelectedAreaArea();
		// };
		
	}catch(err){
		console.log(err);
		// clearSelectedAreas();
	}
	

}

function updateSelectedAreaArea(){
	var selectedFeatures = getSelectedGEEFeatureCollection();
	if(selectedFeatures === undefined){
		$('#selected-features-area').html('0 hectares / 0 acres');
	}else{
		$('#selected-features-area').html('Updating');
		$('#select-features-area-spinner').show();
		// selectedFeatures.evaluate(function(values){console.log(values)})
		ee.Array(selectedFeatures.toList(10000,0).map(function(f){return ee.Feature(f).area()})).reduce(ee.Reducer.sum(),[0]).evaluate(function(values,error){
			if(values === undefined){values = 0;console.log(error)};
        	$('#selected-features-area').html((values*0.0001).formatNumber() + ' hectares / '+(values*0.000247105).formatNumber() + ' acres');
        	$('#select-features-area-spinner').hide();
    	})
	}
	
}
function updateUserDefinedAreaArea(){
	var area = 0;
	Object.values(udpPolygonObj).map(function(poly){
		area += google.maps.geometry.spherical.computeArea(poly.getPath());
	});
	$('#user-defined-features-area').html((area*0.0001).formatNumber()+ ' hectares / '+(area*0.000247105).formatNumber()+ ' acres');
        	
	
}
function turnOffVectorLayers(){
	$(".vector-layer-checkbox").trigger("turnOffAll");
}
function turnOffSelectLayers(){
	$(".select-layer-checkbox").trigger("turnOffAll");
}
function turnOffSelectGeoJSON(){
	Object.keys(selectedFeaturesJSON).map(function(k){
        selectedFeaturesJSON[k].geoJSON.forEach(function(f){selectedFeaturesJSON[k].geoJSON.setMap(null)});
    })
}
function turnOnSelectGeoJSON(){
	Object.keys(selectedFeaturesJSON).map(function(k){
        selectedFeaturesJSON[k].geoJSON.forEach(function(f){selectedFeaturesJSON[k].geoJSON.setMap(map)});
    })
}
function chartSelectedAreas(){
    
    // Map2.addLayer(selectedFeatures,{layerType :'geeVector'},'Selected Areas');
    // console.log(selectedFeatures);
    // console.log(ee.FeatureCollection(selectedFeatures).getInfo());
    var selectedFeatures = getSelectedGEEFeatureCollection();
    if(selectedFeatures !== undefined && selectedFeatures.size().getInfo() !== 0){
    	var title = $('#user-selected-area-name').val();
    	if(title === ''){title = getSelectedAreasNameList(false).join(' - ');}
    	$('#summary-spinner').slideDown();
        makeAreaChart(selectedFeatures,title + ' ' + mode + ' Summary',true)
    }else{showMessage('Error!','Please select area to chart. Turn on any of the layers and click on polygons to select them.  Then hit the <kbd>Chart Selected Areas</kbd> button.')}
    try{}
    catch(err){
        console.log(err);console.log(selectedFeatures.size().getInfo())
    };
    
}

function clearQueryGeoJSON(){
	queryGeoJSON.forEach(function(f){queryGeoJSON.remove(f)});
}

var  getQueryImages = function(lng,lat){
	var lngLat = [lng, lat];
	$('.gm-ui-hover-effect').show();
	var outDict = {};
	$('#summary-spinner').slideDown();
	// $('#query-container').empty();
	infowindow.setMap(null);
	infowindow.setPosition({lng:lng,lat:lat});
	

	var queryContent =`<h6 style = 'font-weight:bold;'>Queried values for<br>lng: ${lng.toFixed(3).toString()} lat: ${lat.toFixed(3).toString()}</h6>
						<table class="table table-hover bg-white"><tbody>`
	 

	var queryLine = '<h6>Queried values for lng: '+lng.toFixed(3).toString() + ' lat: '+lat.toFixed(3).toString()+ '</h6>';

	function makeQueryTable(value,q,k){
		queryContent += `<tr class = 'bg-black'><th></th><td></td></tr>`;
		if(q.type === 'geeImage'){
			if(value === null){
				// var queryLine = "<div style='width:90%;height:2px;border-radius:5px;margin:2px;background-color:#000'></div>" +k+ ': null <br>';
				queryContent +=`<tr><td>${k}</td><td>null</td></tr>`;

				// $('#query-container').append(queryLine);
			}
			else if(Object.keys(value).length === 1 ){
				var tValue = JSON.stringify(Object.values(value)[0]);
				if(q.queryDict !== null && q.queryDict !== undefined){
					tValue = q.queryDict[parseInt(tValue)]
				}
				// var queryLine = "<div style='width:90%;height:2px;border-radius:5px;margin:2px;background-color:#000'></div>" +k+ ': '+JSON.stringify(Object.values(value)[0]) + "<br>";
				queryContent +=`<tr><th>${k}</th><td>${tValue}</td></tr>`;
				// $('#query-container').append(queryLine);
			}
			else{
				var queryLine = "<div style='width:90%;height:2px;border-radius:5px;margin:2px;background-color:#000'></div>" +k+ ':<br>';
				queryContent += `<tr><th>${k}</th><th>Multi band</th></tr>`;
				// $('#query-container').append(queryLine);
				Object.keys(value).map(function(kt){
					var v = value[kt].toFixed(2).toString();
					// var queryLine =  kt+ ': '+v + "<br>";
					queryContent += `<tr><td>${kt}</td><td>${v}</td></tr>`;
					// $('#query-container').append(queryLine);
				});
				
			}	
		}else if(q.type === 'geeVectorImage'){

            var infoKeys = Object.keys(value);
            queryContent += `<tr><th>${k}</th><th>Attribute Table</th></tr>`;
            // queryContent += `<tr><th>Attribute Name</th><th>Attribute Value</th></tr>`;
            
            infoKeys.map(function(name){
                var valueT = value[name];
                queryContent +=`<tr><th>${name}</th><td>${valueT}</td></tr>`;
            });
		}
		
		infowindow.setContent(queryContent);
	  	infowindow.open(map);



	if(keyI >= keyCount){
		map.setOptions({draggableCursor:'help'});
		map.setOptions({cursor:'help'});
		$('#summary-spinner').slideUp();
		// queryContent += `<tr class = 'bg-black'><th></th><td></td></tr>`;
		// queryContent +=`</tbody></table>`;
	  // infowindow.setContent(queryContent);
	  // infowindow.open(map);
	}
	
	}
	// queryContent += queryLine;
	// $('#query-container').append(queryLine);
	var keys = Object.keys(queryObj);
	var keysToShow = [];
	keys.map(function(k){
		var q = queryObj[k];
		if(q.visible){keysToShow.push(k);}
	})

	var keyCount = keysToShow.length;
	var keyI = 1;
	
	if(keyCount === 0){
		$('#summary-spinner').slideUp();
		showMessage('No Layers to Query!','No visible layers to query. Please turn on any layers you would like to query');

	}
	clearQueryGeoJSON();
	keysToShow.map(function(k){
		var q = queryObj[k];
	

		if(q.visible){
			var clickPt = ee.Geometry.Point(lngLat);
			if(q.type === 'geeImage'){
				var img = ee.Image(q.queryItem);
				img.reduceRegion(ee.Reducer.first(),clickPt,null,'EPSG:5070',[30,0,-2361915.0,0,-30,3177735.0]).evaluate(function(value){keyI++;makeQueryTable(value,q,k);})
			}else if(q.type === 'geeVectorImage'){
				var features = q.queryItem.filterBounds(clickPt);
				features.evaluate(function(values){
					keyI++;
					
		            queryGeoJSON.addGeoJson(values);
           
					var features = values.features; 
					
					if(features.length === 0){
						queryContent += `<tr class = 'bg-black'><th></th><td></td></tr>`;
						queryContent += `<tr><th>${k}</th><td>null</td></tr>`;
						infowindow.setContent(queryContent);
	  					infowindow.open(map);
					}else{
						features.map(function(f){
      						makeQueryTable(f.properties,q,k)
      					})	
					}
      				
            		
        		})
			}
			
			// outDict[k] = value;

		}
	})
	
	
	
	
};
var fsb;
// var fieldName = 'NAME';
// var fsbPath = 'TIGER/2018/Counties';

// var fieldName = 'name';
// var fsbPath = 'USGS/WBD/2017/HUC10';

// var fieldName = 'FORESTNAME';
// var fsbPath = 'projects/USFS/LCMS-NFS/CONUS-Ancillary-Data/FS_Boundaries';

function populateAreaChartDropdown(){
  $('#area-collection-dropdown').empty();
  var keys = Object.keys(areaChartCollections)
  whichAreaChartCollection = keys[0];
  if(keys.length > 1){
    Object.keys(areaChartCollections).map(function(k){
    addDropdownItem('area-collection-dropdown',areaChartCollections[k].label,k);
    });
    $('#area-collection-dropdown-container').show();
  }else{$('#area-collection-dropdown-container').hide();}
  
}
$('#area-collection-dropdown').change(function(){
  console.log(whichAreaChartCollection);
  setupFSB();
})
// var fieldName = 'PARKNAME';
// var fsbPath = 'projects/USFS/LCMS-NFS/CONUS-Ancillary-Data/NPS_Boundaries';
function setupFSB(){
  $('#forestBoundaries').empty();
  $('#forestBoundaries').hide();
  // $('#summary-spinner').slideDown();
  $('#select-area-spinner').show();
  // $('#select-area-spinner').addClass(`fa-spin fa fa-spinner`);

  // var fsb = ee.FeatureCollection('projects/USFS/LCMS-NFS/CONUS-Ancillary-Data/FS_Boundaries');
  // var fieldName = 'FORESTNAME';

  	var nfsFieldName = 'FORESTNAME';
	var nfs = ee.FeatureCollection('projects/USFS/LCMS-NFS/CONUS-Ancillary-Data/FS_Boundaries');


	var npsFieldName = 'PARKNAME';
	var nps = ee.FeatureCollection('projects/USFS/LCMS-NFS/CONUS-Ancillary-Data/NPS_Boundaries');

	nfs = nfs.map(function(f){return f.set('label',f.get(nfsFieldName))});


	nps = nps.map(function(f){return f.set('label',ee.String(f.get(npsFieldName)).cat(' National Park'))});

	fsb = nfs.merge(nps);
	fieldName = 'label';
 
	if(areaChartCollections[whichAreaChartCollection] !== undefined){
		fsb = fsb.filterBounds(areaChartCollections[whichAreaChartCollection].collection.geometry());

		  var names = ee.List(ee.Dictionary(fsb.aggregate_histogram(fieldName)).keys());
		  ee.Dictionary.fromLists(names, names).evaluate(function(d){
		  	// print('d');print(d);
		  	 var mySelect = $('#forestBoundaries');
			  var choose;
			  mySelect.append($('<option></option>').val(choose).html('Choose an area'))
			  $.each(d, function(val,text) {
			     
			      mySelect.append($('<option></option>').val(val).html(text)
			      );
			  });
			  // $('#select-area-spinner').removeClass('fa-spin fa fa-spinner');
			  $('#select-area-spinner').hide();
			  $('#forestBoundaries').show();
		  })
	}
  
 	
 
};

var udp;
var udpList = [];
var whichAreaDrawingMethod;

// function startAreaCharting(){
// 	console.log('starting area charting');
// 	// $('#areaChartingTabs').slideDown();
// 	$("#charting-parameters").slideDown();
// 	if(whichAreaDrawingMethod === '#user-defined'){console.log('starting user defined area charting');startUserDefinedAreaCharting();}
//   	else if(whichAreaDrawingMethod === '#shp-defined'){$('#areaUpload').slideDown();startShpDefinedCharting();}
//   	else if(whichAreaDrawingMethod === '#pre-defined'){$('#pre-defined').slideDown();}

// }
function areaChartingTabSelect(target){

	stopAreaCharting();
	stopCharting();
	// $('#charting-container').slideDown();
	// $("#charting-parameters").slideDown();
	
   
	whichAreaDrawingMethod = target;
  	console.log(target);
  	if(target === '#user-defined'){startUserDefinedAreaCharting();}
  	else if(target === '#shp-defined'){startShpDefinedCharting();}
  	else if(target === '#pre-defined'){$('#pre-defined').slideDown();}
  	else if(target === '#user-selected'){
  		map.setOptions({draggableCursor:'pointer'});
 		map.setOptions({cursor:'pointer'});
  	}
  	// startAreaCharting();
}
// function listenForUserDefinedAreaCharting(){
//   $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
  	
//   var target = $(e.target).attr("href") // activated tab

//   console.log(target);
//   areaChartingTabSelect(target);
//   });
        
// }
// listenForUserDefinedAreaCharting();
function restartUserDefinedAreaCarting(e){
	// console.log(e);
	if(e === undefined || e.key == 'Delete'|| e.key == 'd'|| e.key == 'Backspace'){
		areaChartingTabSelect(whichAreaDrawingMethod);
		updateUserDefinedAreaArea();
		//startUserDefinedAreaCharting();
	}
	
}
function undoUserDefinedAreaCharting(e){
	// console.log(e);
	if(e === undefined || (e.key == 'z' && e.ctrlKey) ){
		try{
			udpPolygonObj[udpPolygonNumber].getPath().pop(1);
		}catch(err){
			udpPolygonNumber--;
			if(udpPolygonNumber < 1){udpPolygonNumber = 1;showMessage('Error!','No more vertices to undo')}
			udpPolygonObj[udpPolygonNumber].getPath().pop(1);
		}
		updateUserDefinedAreaArea();
        
        // udpList.pop(1);
      }
	
}
function startUserDefinedAreaCharting(){
	console.log('start clicking');
	
	// udpList = [];



	map.setOptions({draggableCursor:'crosshair'});
    map.setOptions({disableDoubleClickZoom: true });
    google.maps.event.clearListeners(mapDiv, 'dblclick');
    google.maps.event.clearListeners(mapDiv, 'click');
    window.addEventListener("keydown", restartUserDefinedAreaCarting);
    window.addEventListener("keydown", undoUserDefinedAreaCharting);
   try{
   	udp.setMap(null);
   }catch(err){};
   udpPolygonObj[udpPolygonNumber]  = new google.maps.Polyline(udpOptions);
   // udp = new google.maps.Polyline(udpOptions);

   udpPolygonObj[udpPolygonNumber].setMap(map);
   google.maps.event.addListener(udpPolygonObj[udpPolygonNumber], "click", updateUserDefinedAreaArea);
   google.maps.event.addListener(udpPolygonObj[udpPolygonNumber], "mouseup", updateUserDefinedAreaArea);
   google.maps.event.addListener(udpPolygonObj[udpPolygonNumber], "dragend", updateUserDefinedAreaArea);
   
   mapHammer = new Hammer(document.getElementById('map'));
   // google.maps.event.addDomListener(mapDiv, 'click', function(event) {
        mapHammer.on("tap", function(event) {
        

        var path = udpPolygonObj[udpPolygonNumber].getPath();
        var x =event.center.x;
        var y = event.center.y;
        clickLngLat =point2LatLng(x,y);
        // udpList.push([clickLngLat.lng(),clickLngLat.lat()])
        path.push(clickLngLat);
        updateUserDefinedAreaArea();
    
    });
   
	mapHammer.on("doubletap", function() {
	// 	$('#summary-spinner').slideDown();
        var path = udpPolygonObj[udpPolygonNumber].getPath();
        udpPolygonObj[udpPolygonNumber].setMap(null);
        udpPolygonObj[udpPolygonNumber] = new google.maps.Polygon(udpOptions);
        udpPolygonObj[udpPolygonNumber].setPath(path);
        udpPolygonObj[udpPolygonNumber].setMap(map);
        google.maps.event.addListener(udpPolygonObj[udpPolygonNumber], "click", updateUserDefinedAreaArea);
   		google.maps.event.addListener(udpPolygonObj[udpPolygonNumber], "mouseup", updateUserDefinedAreaArea);
   		google.maps.event.addListener(udpPolygonObj[udpPolygonNumber], "dragend", updateUserDefinedAreaArea);
        udpPolygonNumber++
        udpPolygonObj[udpPolygonNumber]  = new google.maps.Polyline(udpOptions);
        udpPolygonObj[udpPolygonNumber].setMap(map);
        google.maps.event.addListener(udpPolygonObj[udpPolygonNumber], "click", updateUserDefinedAreaArea);
   		google.maps.event.addListener(udpPolygonObj[udpPolygonNumber], "mouseup", updateUserDefinedAreaArea);
   		google.maps.event.addListener(udpPolygonObj[udpPolygonNumber], "dragend", updateUserDefinedAreaArea);
   
        updateUserDefinedAreaArea();
 //        google.maps.event.clearListeners(mapDiv, 'dblclick');
 //    	google.maps.event.clearListeners(mapDiv, 'click');
 //    	map.setOptions({draggableCursor:'hand'});
 // 		map.setOptions({cursor:'hand'});
 // 		mapHammer.destroy()
 // 		// var geoJson = {'type':'Polygon',
	// 		// 	'geometry':[udpList]};
	// 	try{
	// 		var userArea = ee.FeatureCollection([ee.Feature(ee.Geometry.Polygon(udpList))]);


		
	// 	// $('#areaUpload').slideDown();
	  	
	//   	// $("#charting-parameters").slideDown();
	//   	var udpName = $('#user-defined-area-name').val();
	//   	if(udpName === ''){udpName = 'User Defined Area '+userDefinedI.toString() ;userDefinedI++;};
	//   	var addon = ' '+ areaChartCollections[whichAreaChartCollection].label+ ' Summary';
	//   	udpName +=  addon
	// 	// Map2.addLayer(userArea,{},udpName,false)
	// 	// console.log(userArea.getInfo());
	// 	makeAreaChart(userArea,udpName,true);
	// 	}
	// 	catch(err){areaChartingTabSelect(whichAreaDrawingMethod);showMessage('Error',err);}
		

	});
    // google.maps.event.addDomListener(mapDiv, 'dblclick', function() {
      
    // });

}
function chartUserDefinedArea(){
	try{
		var userArea = [];
		var anythingToChart = false;
		Object.values(udpPolygonObj).map(function(v){
			var coords = v.getPath().g;
			var f = [];
			coords.map(function(coord){f.push([coord.lng(),coord.lat()])});
		
			if(f.length > 2){userArea.push(ee.Feature(ee.Geometry.Polygon(f)));anythingToChart = true}
		});
		if(!anythingToChart){
			showMessage('Error!','Please draw polygons on map. Double-click to finish drawing polygon. Once all polygons have been drawn, click the <kbd>Chart Selected Areas</kbd> button to create chart.')
		}
		else{
			userArea = ee.FeatureCollection(userArea);
			var udpName = $('#user-defined-area-name').val();
		  	if(udpName === ''){udpName = 'User Defined Area '+userDefinedI.toString() ;userDefinedI++;};
		  	var addon = ' '+ areaChartCollections[whichAreaChartCollection].label+ ' Summary';
		  	udpName +=  addon
		  	$('#summary-spinner').slideDown();
			makeAreaChart(userArea,udpName,true);	
		}
		
		}
		catch(err){showMessage('Error',err);}
	

}
function chartChosenArea(){
  // $('#charting-container').slideDown();
    // $("#charting-parameters").slideDown();
    $('#summary-spinner').slideDown();
    try{
   	udp.setMap(null);
   }catch(err){};
    map.setOptions({draggableCursor:'progress'});
			map.setOptions({cursor:'progress'});
  // var fsb = ee.FeatureCollection('projects/USFS/LCMS-NFS/CONUS-Ancillary-Data/FS_Boundaries');
  // var fieldName = 'FORESTNAME';

 
  var chosenArea = $('#forestBoundaries').val();
  var chosenAreaName = chosenArea + ' '+ areaChartCollections[whichAreaChartCollection].label + ' Summary';
  var chosenAreaGeo = fsb.filter(ee.Filter.eq(fieldName,chosenArea));

  makeAreaChart(chosenAreaGeo,chosenAreaName);
  // console.log('Charting ' + chosenArea);
}
function getAreaSummaryTable(areaChartCollection,area,xAxisProperty,multiplier){
	if(xAxisProperty === null || xAxisProperty === undefined){xAxisProperty = 'year'};
	if(multiplier === null || multiplier === undefined){multiplier = 100};
	// var test = ee.Image(areaChartCollection.first());
	// test= test.reduceRegion(ee.Reducer.fixedHistogram(0, 2, 2),area,null,null,null,true,1e13,2);
	// print(test.getInfo());
	if(xAxisProperty === 'year'){
		areaChartCollection = areaChartCollection.map(function(img){return img.set('year',ee.Number(ee.Date(img.get('system:time_start')).get('year')).format())});
		
	}

	var bandNames = ee.Image(areaChartCollection.first()).bandNames();
	
	return areaChartCollection.toList(10000,0).map(function(img){
						img = ee.Image(img);
				    // img = ee.Image(img).clip(area);
				    var t = img.reduceRegion(ee.Reducer.fixedHistogram(0, 2, 2),area,30,'EPSG:5070',null,true,1e13,2);
				    var xAxisLabel = img.get(xAxisProperty);
				    // t = ee.Dictionary(t).toArray().slice(1,1,2).project([0]);
				    // var lossT = t.slice(0,2,null);
				    // var gainT = t.slice(0,0,2);
				    // var lossSum = lossT.reduce(ee.Reducer.sum(),[0]).get([0]);
				    // var gainSum = gainT.reduce(ee.Reducer.sum(),[0]).get([0]);
				    // var lossPct = ee.Number.parse(lossT.get([1]).divide(lossSum).multiply(100).format('%.2f'));
				    // var gainPct = ee.Number.parse(gainT.get([1]).divide(gainSum).multiply(100).format('%.2f'));
				    // return [year,lossPct,gainPct];//ee.List([lossSum]);
				    t = ee.Dictionary(t);
				    // var values = t.values();
				    // var keys = t.keys();
				    var sum;
				    values = bandNames.map(function(bn){
				      var a = t.get(bn);
				      a = ee.Array(a).slice(1,1,2).project([0]);
				      sum = ee.Number(a.reduce(ee.Reducer.sum(),[0]).get([0]));
				      a = ee.Number(a.toList().get(1));
				      var pct = a.divide(sum).multiply(multiplier);
				      return pct;
				    });
				    values = ee.List([xAxisLabel]).cat(values);
				    return values;
				})
}

function expandChart(){
	console.log('expanding');
	$('#curve_chart_big').slideDown();
	$('#curve_chart_big_modal').modal();
	closeChart();
}
function makeAreaChart(area,name,userDefined){
	areaGeoJson = null;
	console.log('making chart');console.log(userDefined);
	if(userDefined === undefined || userDefined === null){userDefined = false};
	
	areaChartingCount++;
	// closeChart();
	// document.getElementById('curve_chart_big').style.display = 'none';
	var fColor = randomColor().slice(1,7);
	if(userDefined === false){
		
		Map2.addLayer(area,{},name,true,null,null,name + ' for area summarizing','reference-layer-list');
	}
	
	// updateProgress(50);
	area = area.set('source','LCMS_data_explorer');
	centerObject(area);
	area = area.geometry();

	var areaChartCollection = areaChartCollections[whichAreaChartCollection].collection;
	var xAxisProperty = areaChartCollections[whichAreaChartCollection].xAxisProperty;
	var xAxisLabel = areaChartCollections[whichAreaChartCollection].xAxisLabel;
	var yAxisLabel = areaChartCollections[whichAreaChartCollection].yAxisLabel;
	if(xAxisProperty === null || xAxisProperty == undefined){xAxisProperty = 'year'};
	if(xAxisLabel === null || xAxisLabel == undefined){xAxisLabel = null};
	if(yAxisLabel === null || yAxisLabel == undefined){yAxisLabel = '% Area'};
	yAxisLabel = areaChartFormatDict[areaChartFormat].label;
	var totalArea = area.area();
	if(['Acres','Hectares'].indexOf(areaChartFormat)>-1){
		multiplier =totalArea.multiply(areaChartFormatDict[areaChartFormat].mult);
	}
	else{
		multiplier = areaChartFormatDict[areaChartFormat].mult;
	}
	
	var bandNames = ee.Image(areaChartCollection.first()).bandNames().getInfo();
	bandNames = bandNames.map(function(bn){return bn.replaceAll('_',' ') + ' '+areaChartFormatDict[areaChartFormat].label});
	bandNames.unshift(xAxisProperty)
	var table = getAreaSummaryTable(areaChartCollection,area,xAxisProperty,multiplier);
	// var bandNames = ee.Image(1).rename(['Year']).addBands(ee.Image(areaChartCollection.first())).bandNames().getInfo().map(function(i){return i.replaceAll('_',' ')});
	var iteration = 0;
	var maxIterations = 60;
	var success = false;
	
	var tableT;
	function evalTable(){
		table.evaluate(function(tableT, failure){
			print(iteration);
			print(tableT);
			print(failure);
			print(areaChartingCount);
			if(failure !== undefined && iteration < maxIterations && failure.indexOf('aggregations') > -1){evalTable()}
			else if(failure === undefined) {
				// tableT.unshift(['year','Loss %','Gain %']);
				tableT.unshift(bandNames)
				$('#summary-spinner').slideUp();
				var stackedAreaChart = areaChartCollections[whichAreaChartCollection].stacked;
				var steppedLine = areaChartCollections[whichAreaChartCollection].steppedLine;
				var colors = areaChartCollections[whichAreaChartCollection].colors;
				var chartType = areaChartCollections[whichAreaChartCollection].chartType
				if(chartType === null || chartType === undefined){chartType = 'line'}
				addChartJS(tableT,name,chartType,stackedAreaChart,steppedLine,colors,xAxisLabel,yAxisLabel);
		
				// areaChartingTabSelect(whichAreaDrawingMethod);
				// map.setOptions({draggableCursor:'hand'});
				// map.setOptions({cursor:'hand'});
				// if(whichAreaDrawingMethod === '#user-defined'){
					area.evaluate(function(i){
						areaGeoJson = i;
						areaGeoJson[name] = tableT;
						if(areaGeoJson !== undefined && areaGeoJson !== null){
					    	$('#chart-download-dropdown').append(`<a class="dropdown-item" href="#" onclick = "exportJSON('${name}.geojson', areaGeoJson)">geoJSON</a>`);
					   }});
				// }
				areaChartingCount--;
			}
			else{
				$('#summary-spinner').slideUp();
				// map.setOptions({draggableCursor:'hand'});
				// map.setOptions({cursor:'hand'});
				
				// areaChartingTabSelect(whichAreaDrawingMethod);
				if(failure.indexOf('Dictionary.toArray: Unable to convert dictionary to array')>-1 || failure.indexOf("Array: Parameter 'values' is required.")> -1){
					failure = 'Most likely selected area does not overlap with selected LCMS study area<br>Please select area that overlaps with products<br>Raw Error Message:<br>'+failure;
				}
				showMessage('<i class="text-dark text-uppercase fa fa-exclamation-triangle"></i> Error! Try again',failure)};
			iteration ++;
		

		
			
	});
		
	}
	evalTable();
	
	


	
}
function fixGeoJSONZ(f){
	console.log('getting rid of z');
	f.features = f.features.map(function(f){
    f.geometry.coordinates = f.geometry.coordinates.map(function(c){
    															return c.map(function(i){
    																return i.slice(0,2)})
																		});
    return f;
  });
	console.log(f);

	return f
}
function runShpDefinedCharting(){

		if(jQuery('#areaUpload')[0].files.length > 0){
			try{udp.setMap(null);}
			catch(err){console.log(err)};
		
			$('#summary-spinner').slideDown();

			var name = jQuery('#areaUpload')[0].files[0].name.split('.')[0] 
			var addon = ' '+ areaChartCollections[whichAreaChartCollection].label + ' Summary';
			if(name.indexOf(addon) === -1){
				name += addon;
			}
			map.setOptions({draggableCursor:'progress'});
			map.setOptions({cursor:'progress'});
			convertToGeoJSON('areaUpload').done(function(converted){
				console.log('successfully converted to JSON');
				console.log(converted);
					

			//First try assuming the geoJSON has spatial info
			try{
				var area =ee.FeatureCollection(converted.features.map(function(t){return ee.Feature(t).dissolve(100,ee.Projection('EPSG:4326'))}));
				} 
			//Fix it if not
			catch(err){
				err = err.toString();
				console.log('Error');console.log(err);
				if(err.indexOf('Error: Invalid GeoJSON geometry:') > -1){
					var area =ee.FeatureCollection(fixGeoJSONZ(converted).features.map(function(t){return ee.Feature(t).dissolve(100,ee.Projection('EPSG:4326'))}))	
					}
				else{
					
					showMessage('<i class="text-dark text-uppercase fa fa-exclamation-triangle"></i>Error Ingesting Study Area!',err)
					}
				};
				// var area  =ee.FeatureCollection(converted.features.map(function(t){return ee.Feature(t).dissolve(100,ee.Projection('EPSG:4326'))}));//.geometry()//.dissolve(1000,ee.Projection('EPSG:4326'));
				makeAreaChart(area,name);
			})
		
	}else{showMessage('No Summary Area Selected','Please select a .zip shapefile or a .geojson file to summarize across')}
}
function startShpDefinedCharting(){
	// $('#areaUpload').change(function(){runShpDefinedCharting()})
};
function stopAreaCharting(){
	window.removeEventListener("keydown", restartUserDefinedAreaCarting);
    window.removeEventListener("keydown", undoUserDefinedAreaCharting);
	console.log('stopping area charting');
	try{
   	Object.keys(udpPolygonObj).map(function(k){
        udpPolygonObj[k].setMap(null) ;       
    });
    udpPolygonObj = {};
    udpPolygonNumber = 1;
    updateUserDefinedAreaArea();
   }catch(err){};
 //   $('#areaChartingTabs').slideUp();
	$('#areaUpload').unbind('change')
	// $("#charting-parameters").slideUp();
	// $('#user-defined').slideUp();
	// $('#shp-defined').slideUp();
	// $('#pre-defined').slideUp();
	$('#summary-spinner').slideUp();
	// // $('#areaUpload').slideUp();
	// google.maps.event.clearListeners(mapDiv, 'dblclick');
 //    google.maps.event.clearListeners(mapDiv, 'click');
	// updateProgress(1);
	// closeChart();

};

function startQuery(){
	areaGeoJson = null;
	try{udp.setMap(null);}catch(err){console.log(err)};

	google.maps.event.clearListeners(mapDiv, 'dblclick');
    google.maps.event.clearListeners(mapDiv, 'click');
	map.setOptions({draggableCursor:'help'});
 	map.setOptions({cursor:'help'});
 	mapHammer = new Hammer(document.getElementById('map'));
   	mapHammer.on("doubletap", function(e) {
	// google.maps.event.addDomListener(mapDiv,"dblclick", function (e) {
			$('#summary-spinner').slideDown()
			map.setOptions({draggableCursor:'progress'});
			map.setOptions({cursor:'progress'});
			
			print('Map was double clicked');
			var x =e.center.x;//clientX;
        	var y = e.center.y;console.log(x);
        	center =point2LatLng(x,y);

			

			var pt = ee.Geometry.Point([center.lng(),center.lat()]);
			var plotBounds = pt.buffer(plotRadius).bounds();
	   		addClickMarker(plotBounds)

			marker.setMap(map);

			getQueryImages(center.lng(),center.lat());

		})
   		mapHammer.on("tap",function(e){
   			infowindow.setMap(null);
   			clearQueryGeoJSON();
   		})
	// document.getElementById('query-container').style.display = 'block';
}
function stopQuery(){
	print('stopping');
	try{
		mapHammer.destroy();
		map.setOptions({draggableCursor:'hand'});
		map.setOptions({cursor:'hand'});
		// $('#query-container').text('Double click on map to query values of displayed layers at a location');
		google.maps.event.clearListeners(mapDiv, 'dblclick');
		map.setOptions({cursor:'hand'});
		infowindow.setMap(null);
		marker.setMap(null);
	}catch(err){};
	
	// document.getElementById('query-container').style.display = 'none';
}
function getImageCollectionValuesForCharting(pt){
	
	// var timeSeries = years.map(function(yr){
	// 	var imageT = l5s.filterDate(ee.Date.fromYMD(yr,1,1),ee.Date.fromYMD(yr,12,31)).median().set('system:time_start',ee.Date.fromYMD(yr,6,1).millis());
	// 	return imageT
	// })
	// timeSeries = ee.ImageCollection.fromImages(timeSeries);
	var icT = ee.ImageCollection(chartCollection.filterBounds(pt));
	var tryCount = 2;
	// print(icT.getRegion(pt.buffer(plotRadius),plotScale))
	try{var allValues = icT.getRegion(pt,null,'EPSG:5070',[30,0,-2361915.0,0,-30,3177735.0]).evaluate();
		print(allValues)
		return allValues}
	catch(err){showMessage('<i class="text-dark text-uppercase fa fa-exclamation-triangle"></i> Charting error',err.message)};//reRun();setTimeout(function(){icT.getRegion(pt.buffer(plotRadius),plotScale).getInfo();},5000)}
	

}
Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(), !mm[1] && '0', mm, !dd[1] && '0', dd].join(''); // padding
};
function getDataTable(pt){
	// var chartScale = plotScale;
	// var chartPtSize = plotRadius;
	// addToMap(pt.buffer(chartPtSize));

	
	var values = getImageCollectionValuesForCharting(pt);
	globalChartValues	 = values;
	// var values = imageCollectionForCharting.getRegion(pt.buffer(chartPtSize),chartScale).getInfo();
	
	if(chartIncludeDate){var startColumn = 3}else{var startColumn = 4};
	var header = values[0].slice(startColumn);

	values = values.slice(1).map(function(v){return v.slice(startColumn)}).sort(sortFunction);




	print(values)
	if(chartIncludeDate){
	values = values.map(function(v){
			  var d = [new Date(v[0])];
			  v.slice(1).map(function(vt){d.push(vt)})
			  return d})
	}

	var forChart = [header];
	values.map(function(v){forChart.push(v)});
	
	return forChart
}

function changeChartType(newType,showExpanded){
	if(!showExpanded){showExpanded = false};
	newType.checked = true;
	$(newType).checked = true;
	chartType = newType.value;
	uriName = mode+'_Product_Time_Series_for_lng_' +center.lng().toFixed(4).toString() + '_' + center.lat().toFixed(4).toString(); //+ ' Res: ' +plotScale.toString() + '(m) Radius: ' + plotRadius	.toString() + '(m)';
	csvName = uriName + '.csv'
	document.getElementById('curve_chart').style.display = 'none';
	// setTimeout(function(){updateProgress(80);},0);
	Chart(showExpanded);
}

//////////////////////////////////////////////////////////////////
//ChartJS code
function downloadChartJS(chart,name){
	var link = document.createElement("a");
	link.download = name;
	link.href = chart.toBase64Image();
	link.click();
	delete link;
}

Chart.pluginService.register({
    beforeDraw: function (chart, easing) {
        if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
            var helpers = Chart.helpers;
            var ctx = chart.chart.ctx;
            var chartArea = chart.chartArea;

            ctx.save();
            ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
            ctx.fillRect(chartArea.left-90, chartArea.top-40, chartArea.right - chartArea.left+190, chartArea.bottom - chartArea.top+350);
            ctx.restore();
        }
    }
});
var dataToTable = function (dataset) {
    var html = '<table>';
    html += '<thead><tr><th style="width:120px;">#</th>';
    
    var columnCount = 0;
    jQuery.each(dataset.datasets, function (idx, item) {
        html += '<th style="background-color:' + item.fillColor + ';">' + item.label + '</th>';
        columnCount += 1;
    });

    html += '</tr></thead>';

    jQuery.each(dataset.labels, function (idx, item) {
        html += '<tr><td>' + item + '</td>';
        for (i = 0; i < columnCount; i++) {
            html += '<td style="background-color:' + dataset.datasets[i].fillColor + ';">' + (dataset.datasets[i].data[idx] === '0' ? '-' : dataset.datasets[i].data[idx]) + '</td>';
        }
        html += '</tr>';
    });

    html += '</tr><tbody></table>';

    return html;
};
var chartJSChart;
var chartType;
if(localStorage.tableOrChart === undefined || localStorage.tableOrChart === null){
	// if(mode === 'MTBS'){localStorage.tableOrChart = 'table'}
	// else{
		localStorage.tableOrChart = 'chart'
	// };
	
}

addModal('main-container','chart-modal');//addModalTitle('chart-modal','test');$('#chart-modal-body').append('hello');$('#chart-modal').modal();
function addChartJS(dt,title,chartType,stacked,steppedLine,colors,xAxisLabel,yAxisLabel){
	var displayXAxis = true;var displayYAxis = true;
	if(xAxisLabel === null || xAxisLabel === undefined){xAxisLabel = '';displayXAxis = false};
	if(yAxisLabel === null || yAxisLabel === undefined){yAxisLabel = '';displayYAxis = false};
	if(colors === null || colors === undefined){colors = chartColors};
	if(chartType === null || chartType === undefined){chartType = 'line'};
	if(stacked === null || stacked === undefined){stacked = false};
	if(steppedLine === undefined || steppedLine == null){steppedLine = false};
	console.log('starting convert to table')
	dataTable = dataTableNumbersToNames(dt);
	console.log('finished convert to table')
	var h = $(document).height();
	var w = $(document).width();
	if(h/w > 1){
		canvasHeight = '90%';
		canvasWidth = '100%';
	}
	else{
		canvasHeight = '50%';
		canvasWidth = '100%';
	}
	
	// console.log(dt);
	// $('#'+modalID).html('');
	clearModal('chart-modal');
	// if(title !== null && title !== undefined){addModalTitle('chart-modal',title)}
	

    $('#chart-modal-body').append(`<canvas id="chart-canvas" width="${canvasWidth}" height = "${canvasHeight}" ></canvas>`);
    $('#chart-modal-body').append(`<div id="chart-table" style = 'display:none;' width="${canvasWidth}" height = "${canvasHeight}" ></div>`);
    var data = dt.slice(1);
    // console.log(data);
    var firstColumn = arrayColumn(data,0);
    // console.log(firstColumn)
    var columnN = dt[1].length;
    var columns = range(1,columnN);
    console.log('starting to convert to chart')
    var datasets = columns.map(function(i){
        var col = arrayColumn(dt,i);
        var label = col[0];
        var data = col.slice(1);
        // console.log(data)
        data = data.map(function(i){
        			var out;
        			try{out = i.formatNumber(4)}
        			catch(err){out = i;}
        			return out
        			})
        // console.log(data)
        
        
        // var color = randomRGBColor();
        var color = colors[(i-1)%colors.length];
        if(color.indexOf('#') === -1){color = '#'+color};
        var out = {'label':label,
			        pointStyle: 'circle',
			        pointRadius:1,
			        'data':data,
			        'fill':false,
			        'borderColor':color,
			        'lineTension':0,
			        'borderWidth':2,
			        'steppedLine':steppedLine
			    	};
		if(stacked){
			out['fill'] = true;
			out['backgroundColor'] = color
		}
        return out
        // console.log(label);console.log(data)
    });
    console.log('finished to convert to chart')
    chartColorI = 0;
    // console.log(datasets)
    try{
    	chartJSChart.destroy();	
    }
    catch(err){};
    chartJSChart = new Chart($('#chart-canvas'),{
    	"type":chartType,
	    "data":{"labels":firstColumn,
	    "datasets":datasets},
	    "options":{
	    	 title: {
	            display: true,
	            position:'top',
	            text: title.replaceAll('_',' '),
	            // fontColor: '#000',
	            fontSize: 16
	        },
	        legend:{
	        	display:true,
	        	position:'bottom',
	        	
	        	labels : {
	        		boxWidth:5,
	        		usePointStyle: true,
            
        		}
	        },
	        chartArea: {
		        backgroundColor: '#DDD'
		    },
		    scales: {
				yAxes: [{ stacked: stacked ,scaleLabel:{display:displayYAxis,labelString:yAxisLabel}}],
				xAxes: [{ stacked: stacked ,scaleLabel:{display:displayXAxis,labelString:xAxisLabel}}]
			}
    	}	
	});

	
	    $('#chart-download-dropdown').empty();
	    $('#chart-modal-footer').append(`<div class="dropdown">
										  <div class=" dropdown-toggle"  id="chartDownloadDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
										    Download
										  </div>
										  <div id = 'chart-download-dropdown' class="dropdown-menu px-2" aria-labelledby="chartDownloadDropdown">
										    <a class="dropdown-item" href="#" onclick = "downloadChartJS(chartJSChart,'${title}.png')">PNG</a>
										    <a class="dropdown-item" href="#" onclick = "exportToCsv('${title}.csv', dataTable)">CSV</a>
										  </div>
										</div>
										
										<div class="dropdown">
										  <div class=" dropdown-toggle"  id="chartTypeDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
										    Chart Type
										  </div>
										  <div id = 'chart-type-dropdown' class="dropdown-menu px-2" aria-labelledby="chartTypeDropdown">
										    <a class="dropdown-item" href="#" onclick = "toggleChartTable('chart')">Graph</a>
										    <a class="dropdown-item" href="#" onclick = "toggleChartTable('table')">Table</a>
										    <a class="dropdown-item" href="#" onclick = "toggleChartTable('both')">Graph and Table</a>
										  </div>
										</div>
										`);
	   	
	    var chartTableHTML = htmlTable(dataTable);
	    $('#chart-table').append(chartTableHTML);
	    toggleChartTable(localStorage.tableOrChart)
	    $('#chart-modal').modal();
}


function toggleChartTable(showWhich){
	if(showWhich === 'table'){
		$('#chart-canvas').hide();
		$('#chart-legend').hide();
		$('#chart-table').show();
		localStorage.tableOrChart = 'table';
	}else if(showWhich === 'chart'){
		$('#chart-canvas').show();
		$('#chart-legend').show();
		$('#chart-table').hide();
		localStorage.tableOrChart = 'chart';
	}
	else{
		$('#chart-canvas').show();
		$('#chart-legend').show();
		$('#chart-table').show();
		localStorage.tableOrChart = 'both';
	}
}
function change(newType,stacked,steppedLine) {
	if(stacked === undefined || stacked == null){stacked = false};
	if(steppedLine === undefined || steppedLine == null){steppedLine = false};
	

		var config = chartJSChart.config;
		chartJSChart.destroy();
		config.type = newType;
		
		if(stacked){
			config.options.scales = {
				yAxes: [{ stacked: stacked }],//,ticks:{min:0,max:100}}],
				xAxes: [{ stacked: stacked }]
			}

			var datasets = config.data.datasets;
			console.log(datasets);
			datasets = datasets.map(function(dataset){
				dataset['fill'] = true;
				dataset['backgroundColor'] = dataset['borderColor'];
				dataset['steppedLine'] = steppedLine;
				return dataset;
			})
			config.data.datasets = datasets;
		}else{
			config.options.scales = {
				yAxes: [{ stacked: stacked }],
				xAxes: [{ stacked: stacked }]
			}
			var datasets = config.data.datasets;
			console.log(datasets);
			datasets = datasets.map(function(dataset){
				dataset['fill'] = false;
				dataset['backgroundColor'] = null;
				return dataset;
			})
			config.data.datasets = datasets;
		};
		
		
		chartJSChart = new Chart($('#chart-canvas'), config);
	
};
var chartTableDict;
function dataTableNumbersToNames(dataTable){
	try{chartTableDict = chartCollection.get('chartTableDict').getInfo();}
	catch(err){chartTableDict = null};

	var header = dataTable[0];
	var outTable = [header];
	dataTable.slice(1).map(function(r){
		var row = [];
		jQuery.each(r,function(i,value){
			
			var label = header[i];
			
			var tableValue;
			// console.log(value);
        	if(chartTableDict !== null && chartTableDict[label] !== null && chartTableDict[label] !== undefined && value !== undefined && (chartTableDict[label][parseInt(value)] !== undefined || chartTableDict[label][parseFloat(value)] !== undefined)){
        		// console.log('yay');
        		// console.log(chartTableDict[label]);
        		tableValue = chartTableDict[label][parseInt(value)];
        		if(tableValue === undefined){
        			tableValue = chartTableDict[label][parseFloat(value)];
        		}
			}else{
				try{value = value.formatNumber(4)}
				catch(err){};
				tableValue =value ;
			};
			row.push(tableValue);
		});
		outTable.push(row);

	})
	return outTable;

}
function htmlTable(table){
	var html = '<div class = "flexcroll chart-table text-black"><table class="table  table-hover">';
    html += '<thead><tr>';
    var header = dataTable[0];
 

   header.map(function(label){
   		html += '<th  class = "chart-table-first-row bg-black">' + label + '</th>';
      
   });
   html += '</tr></thead>';

    table.slice(1).map(function(r){
		html += '<tr>';
		var columnI = 0;
		r.map(function(value){
			html += '<td>' +  value + '</td>';
			columnI++;
		})	
		html += '</tr>';	
	});
	html += '</tr><tbody></table></div>';
   return html
}


var d =
[["time", "NDVI", "NDVI_LT_fitted", "Land Cover Class", "Land Use Class", "Loss Probability", "Gain Probability"]
,["1985", 0.6456953642384106, null, 0.6000000238418579, 0.30000001192092896, 0.019999999552965164, 0]
,["1986", 0.6456953642384106, 0.6573789473684211, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["1987", 0.6456953642384106, 0.6598578947368421, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["1988", 0.6934156378600823, 0.6623368421052632, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["1989", 0.6934156378600823, 0.6648157894736842, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["1990", 0.6934156378600823, 0.6672947368421053, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["1991", null, 0.6697736842105264, null, null, null, null]
,["1992", null, 0.6722526315789473, null, null, null, null]
,["1993", null, 0.6747315789473685, null, null, null, null]
,["1994", 0.6439862542955326, 0.6772105263157895, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["1995", 0.6439862542955326, 0.6796894736842105, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["1996", 0.6439862542955326, 0.6821684210526316, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["1997", null, 0.6846473684210527, null, null, null, null]
,["1998", 0.7261107729762629, 0.6871263157894737, 0.6000000238418579, 0.30000001192092896, 0.1599999964237213, 0]
,["1999", 0.7261107729762629, 0.6896052631578948, 0.6000000238418579, 0.30000001192092896, 0.07999999821186066, 0]
,["2000", 0.6856763925729443, 0.6920842105263157, 0.6000000238418579, 0.30000001192092896, 0.09000000357627869, 0]
,["2001", 0.6856763925729443, 0.6945631578947369, 0.6000000238418579, 0.30000001192092896, 0.07000000029802322, 0]
,["2002", 0.7016229712858926, 0.6970421052631579, 0.6000000238418579, 0.30000001192092896, 0.05000000074505806, 0]
,["2003", 0.6268958543983821, 0.6995210526315789, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["2004", 0.766839378238342, 0.7020000000000001, 0.6000000238418579, 0.30000001192092896, 0, 0]
,["2005", 0.1652502360717658, 0.1652, 0.10000000149011612, 0.5, 0.75, 0]
,["2006", 0.37468030690537085, 0.21481538461538469, 0.10000000149011612, 0.6000000238418579, 0.07999999821186066, 0.07999999821186066]
,["2007", 0.37468030690537085, 0.26443076923076925, 0.4000000059604645, 0.6000000238418579, 0.09000000357627869, 0.05999999865889549]
,["2008", 0.44536882972823066, 0.3140461538461539, 0.10000000149011612, 0.5, 0.12999999523162842, 0.12999999523162842]
,["2009", 0.3751962323390895, 0.3636615384615385, 0.4000000059604645, 0.6000000238418579, 0.019999999552965164, 0.07999999821186066]
,["2010", 0.3751962323390895, 0.41327692307692304, 0.4000000059604645, 0.6000000238418579, 0, 0.10999999940395355]
,["2011", 0.4737417943107221, 0.4628923076923077, 0.4000000059604645, 0.6000000238418579, 0.05999999865889549, 0.07999999821186066]
,["2012", 0.5301810865191147, 0.5125076923076924, 0.4000000059604645, 0.6000000238418579, 0.12999999523162842, 0.10000000149011612]
,["2013", 0.5709251101321586, 0.562123076923077, 0.4000000059604645, 0.6000000238418579, 0.05000000074505806, 0.8399999737739563]
,["2014", 0.569609507640068, 0.6117384615384616, 0.4000000059604645, 0.30000001192092896, 0, 0.6499999761581421]
,["2015", 0.6380090497737556, 0.6613538461538462, 0.4000000059604645, 0.6000000238418579, 0.019999999552965164, 0.8700000047683716]
,["2016", 0.7084615384615386, 0.7109692307692308, 0.4000000059604645, 0.30000001192092896, 0, 0.75]
,["2017", 0.7672530446549392, 0.7605846153846154, 0.4000000059604645, 0.30000001192092896, 0, 0.6499999761581421]];
var d = [['time','landcover','burnSeverity','cdl','percent_tree_cover','impervious','IDS Mort Type','IDS Mort DCA','IDS Defol Type','IDS Defol DCA','IDS Mort Type Year','IDS Mort DCA Year','IDS Defol Type Year','IDS Defol DCA Year'],
[1984,,,,,,,,,,,,,],
[1985,,,,,,,,,,,,,],
[1986,,,,,,,,,,,,,],
[1987,,,,,,,,,,,,,],
[1988,,,,,,,,,,,,,],
[1989,,,,,,,,,,,,,],
[1990,,,,,,,,,,,,,],
[1991,,,,,,,,,,,,,],
[1992,43,,,,,,,,,,,,],
[1993,,,,,,,,,,,,,],
[1994,,,,,,,,,,,,,],
[1995,,,,,,,,,,,,,],
[1996,,,,,,,,,,,,,],
[1997,,,,,,,,,,,,,],
[1998,,,,,,,,,,,,,],
[1999,,,,,,,,,,,,,],
[2000,,,,,,,,,,,,,],
[2001,43,,,,0,,,,,,,,],
[2002,,,,,,,,,,,,,],
[2003,,,,,,,,,,,,,],
[2004,43,,,,,,,,,,,,],
[2005,,,,,,2,11,,,2005,2005,,],
[2005,,,,,,2,11,,,2005,2005,,],
[2006,43,,,,0,,,,,,,,],
[2007,,,,,,2,80,,,2007,2007,,],
[2007,,,,,,2,80,,,2007,2007,,],
[2008,43,,143,,,,,,,,,,],
[2009,,,143,,,,,,,,,,],
[2010,,,143,,,,,,,,,,],
[2011,43,,142,65,0,,,,,,,,],
[2012,,,143,,,,,,,,,,],
[2013,43,,143,,,,,,,,,,],
[2014,,,143,,,,,,,,,,],
[2015,,,141,,,,,,,,,,],
[2016,43,,143,,0,,,,,,,,],
[2017,,,143,,,,,,,,,,],
[2018,,,143,,,,,,,,,,]]
// addChartJS(d,'test1');

// var legends = chartCollection.get('legends').getInfo();
// if(legends !== null){makeLegend(legends)}


function addClickMarker(plotBounds){
	plotBounds.evaluate(function(plotBounds){
		var coords = plotBounds.coordinates[0];
	
	marker.setMap(null);
	marker=new google.maps.Rectangle({
			// center:{lat:center.lat(),lng:center.lng()},
			// radius:plotRadius,
			 bounds: {
            north: coords[0][1],
            south: coords[2][1],
            east: coords[1][0],
            west: coords[0][0],
          	},
			strokeColor: '#FF0',
			fillOpacity:0
			});
	marker.setMap(map);
	})
	
}
function getEveryOther(values){
			return values.filter(i => values.indexOf(i)%2 ==0)
		}

function makeLegend(legendDicts){
	$( '#chart-modal-body' ).append(`<div id = 'chart-legend' style = 'font-size:0.7em;' class = 'text-dark row'></div>`);
	Object.keys(legendDicts).map(function(k){
		var title = k;
		try{
			var legendDict = JSON.parse(legendDicts[k]);
		}catch(err){
			var legendDict = legendDicts[k];
		}
		
		var legendID = title.replaceAll(' ','-')
		legendID = legendID.replaceAll(':','') + '-legend'
		$( '#chart-legend' ).append(`<div  class = 'px-2' id='${legendID}'>
										<div class = 'p-0'>${title}</div>
										<table  style = 'display:inline-block;vertical-align:top' class = 'table-bordered' id = '${legendID}-table'></table>
									</div>`)

		$('#'+legendID+ '-table').append(`<tr id = '${legendID}-table-names'></tr>`);
		$('#'+legendID+ '-table').append(`<tr id = '${legendID}-table-values'></tr>`);
		Object.keys(legendDict).map(function(k){
			$('#'+legendID+ '-table-names').append(`<td>${k}</td>`)
		})
		Object.keys(legendDict).map(function(k){
			$('#'+legendID+ '-table-values').append(`<td>${legendDict[k]}</td>`)
		})
	})
	

}


function startPixelChartCollection() {
	
	
	

	map.setOptions({draggableCursor:'help'});
	mapHammer = new Hammer(document.getElementById('map'));
   
    mapHammer.on("doubletap", function(event) {
    	areaGeoJson = null;
    	$('#summary-spinner').slideDown();
    	map.setOptions({draggableCursor:'progress'});
        var x =event.center.x;
        var y = event.center.y;
        center =point2LatLng(x,y);

		var pt = ee.Geometry.Point([center.lng(),center.lat()]);
		var plotBounds = pt.buffer(plotRadius).bounds();
   		addClickMarker(plotBounds)
		var icT = ee.ImageCollection(chartCollection.filterBounds(pt));
		
		uriName =  mode+'_Product_Time_Series_for_lng_' +center.lng().toFixed(4).toString() + '_lat_' + center.lat().toFixed(4).toString();
		csvName = uriName + '.csv'
		

		function chartValues(values){
			
			if(chartIncludeDate){var startColumn = 3}else{var startColumn = 4};
			print('Extracted values:');
			print(values);
			var header = values[0].slice(startColumn);
			values = values.slice(1).map(function(v){return v.slice(startColumn)}).sort(sortFunction);
			if(chartIncludeDate){
				values = values.map(function(v){
				  // var d = [new Date(v[0])];
				  // v.slice(1).map(function(vt){d.push(vt)})
				  var d = v[0];
				  var y = (new Date(d).getYear()+1900).toString();
				  // v = v.map(function(i){if(i === null){return i}else{return i.toFixed(3)}})
				  v[0] = y;
				  return v;
				})
			}
			// values = values.map(function(v)
			// 	{return v.map(function(i){
			// 	if(i === null || i === undefined){return i}
			// 	else if(i%1!==0){return parseFloat(i.toFixed(4))}
			// 	else if(i%1==0){return parseInt(i)}
			// 	else{return i}
			// 	})
			// });
			values.unshift(header);
			$('#summary-spinner').slideUp();
			map.setOptions({draggableCursor:'help'});
			addChartJS(values,uriName);
			
			var legends = chartCollection.get('legends').getInfo();
			print(legends);
			if(legends !== null){// && analysisMode === 'advanced'){
				makeLegend(legends);
				toggleChartTable(localStorage.tableOrChart);
				};
   			}

		icT.getRegion(plotBounds,plotScale).evaluate(function(values){
			$('#summary-spinner').slideUp();
			if(values === undefined ||  values === null){
				showMessage('<i class="text-dark text-uppercase fa fa-exclamation-triangle"></i> Error! Try again','Error encountered while charting.<br>Most likely clicked outside study area data extent<br>Try charting an area within the selected study area');
			}
			else if(values.length > 1){
				var expectedLength = icT.size().getInfo()+1
				if(values.length > expectedLength){
					console.log('reducing number of inputs');
					// console.log(expectedLength);
					// console.log(values);
					values = values.slice(0,expectedLength)
					// values = getEveryOther(values);
				}
				chartValues(values);
			}
			else{

				showMessage('Charting Error','Unknown Error<br>Try again');
			}
		})
	})

		
		
      }

// function closeChart(){
// 	updateProgress(1);
// 	$('#curve_chart').slideUp();

	
// }
// function closeBigChart(){
// 	$('#curve_chart_big').slideUp();
	
// }
function stopCharting(){
	// document.getElementById('charting-parameters').style.display = 'none';
	// $("#charting-parameters").slideUp();
	// $("#whichIndexForChartingRadio").slideUp();
	// marker.setMap(null);
	// google.maps.event.clearListeners(mapDiv, 'dblclick');

	// updateProgress(1);
	// closeChart();
	// closeBigChart();
	try{
		mapHammer.destroy();
	}catch(err){};
	try{
		map.setOptions({draggableCursor:'hand'});
		$('#summary-spinner').slideUp();
		infowindow.setMap(null);
		marker.setMap(null);
		
	}catch(err){}
	

}

function exportJSON(filename,json){
	json = JSON.stringify(json);

	var blob = new Blob([json], { type: "application/json" });
	var url  = URL.createObjectURL(blob);

	var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
function exportToCsv(filename, rows) {
        var processRow = function (row) {
            var finalVal = '';
            for (var j = 0; j < row.length; j++) {
                var innerValue = row[j] === null || row[j] === undefined ? '' : row[j].toString();
                if (row[j] instanceof Date) {
                    innerValue = row[j].toLocaleString();
                };

                var result = innerValue.replace(/"/g, '""');
                if (result.search(/("|,|\n)/g) >= 0)
                    result = '"' + result + '"';
                if (j > 0)
                    finalVal += ',';
                finalVal += result;
            }
            return finalVal + '\n';
        };

        var csvFile = '';
        for (var i = 0; i < rows.length; i++) {
            csvFile += processRow(rows[i]);
        }

        var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
        if (navigator.msSaveBlob) { // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            var link = document.createElement("a");
            if (link.download !== undefined) { // feature detection
                // Browsers that support HTML5 download attribute
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }
    }