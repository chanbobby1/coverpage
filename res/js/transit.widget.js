var transitWidget;

function TransitWidget(){}

TransitWidget.prototype = (function() {
	
	var options = {
		startingLoc: "",
		googleDirectionsAPI : {
			quota: 2500,
			transitQuotaCost: 4
		},
		mapZoom: 15
	};
	
	var widgetDiv = $("#transit");
	
	var destinations = [];
	var map;
	var mapCenter;
	
	// Google Services
	var directionsService = new google.maps.DirectionsService();
	var geocoder = new google.maps.Geocoder();
	
	var state = {
		isSetup: false
	};
	
	var getMaxRequestsPerDestinationPerHour = function() {
		var api = options.googleDirectionsAPI;
		
		var maxTransitRequestsPerDay = api.quota/api.transitQuotaCost;
		
		var maxTransitRequestsPerDestination = maxTransitRequestsPerDay/options.destinations.length;
		
		var maxTransitRequestsPerHour = Math.floor(maxTransitRequestsPerDestination/24);
		
		return maxTransitRequestsPerHour;
	}
	
	var getNextTransitTimeAndStop = function(routes) {
		
		var destination,
			duration;
		
		for(var r = 0; r < routes.length; r++) {
			var route = routes[r];
			
			for(var l = 0; l < route.legs.length; l++) {
				var leg = route.legs[l];
				
				
				duration = leg.duration;
				destination = leg.end_address;
				
				for(var s = 0; s < leg.steps.length; s++) {
					var step = leg.steps[s];
					
					if(step.travel_mode == "TRANSIT") {
						
						var transit = step.transit;
						
						var agencies = transit.line.agencies;
						
						var agencyList = "";
						for(var i = 0; i < agencies.length; i++) {
							agencyList += agencies[i].name;
							if(i != agencies.length-1) {
								agencyList += ", ";
							}
						}
						
						var info = {
							destination: destination,
							line: transit.line.short_name,
							agencies: agencyList, 
							stop: transit.departure_stop.name,
							stopLocation: transit.departure_stop.location,
							departureTime: {
								text: transit.departure_time.text,
								time: transit.departure_time.value
							},
							mode: "TRANSIT"
						};
						
						return info;
					}
				}
			}
		}
		
		return {
			destination: destination,
			duration: duration,
			mode: "WALKING"
		};
	}
	
	var handleDirections = function(destination, data) {		
		var status = data.status;
		
		console.log(data);
		
		if(status != "OK") {
			console.error(data);
			
			
			var nextTransitInfo = {
				destination: destination,
				status: data.status
			};
			displayDirections(nextTransitInfo);
			return;
		}
		
		var nextTransitInfo = getNextTransitTimeAndStop(data.routes);
		
		console.log(nextTransitInfo);
		
		if(nextTransitInfo.mode == "TRANSIT") {
			var now = new Date();
			var timeToDepartureInSeconds = nextTransitInfo.departureTime.time.getTime()/1000 - now.getTime()/1000;
			
			var timeToDepartureInMinutes = Math.round(timeToDepartureInSeconds/60);
			
			nextTransitInfo.departureTime.timeToDepartureInMinutes = timeToDepartureInMinutes;
		}
		
		nextTransitInfo.status = status;
		nextTransitInfo.destination = destination;
				
		displayDirections(nextTransitInfo);
	}
	
	var displayDirections = function(transitInfo) {
		var destinationId = "transit_"+transitInfo.destination.toLowerCase().replace(/[\s:]/g, "_");
		
		var $li = $('<li id="'+destinationId+'"></li>');
		
		var $destination = $('<div class="destination"></div>');
		$destination.text(transitInfo.destination);
		
		var $triangle = $('<div class="triangle"></div>');
		
		var $departure = $('<div class="departure"></div>');
		
		//
		if(transitInfo.status == "OK") {
		
			var mode = transitInfo.mode;
		
			if(mode == "TRANSIT") {
				var $transitline = $('<b class="transitline"></b>');
				var $agencies = $('<small  class="agencies"></small>');
				$agencies.text(transitInfo.agencies);
				$transitline.text(transitInfo.line).prepend($agencies);
				
				var timestring = transitInfo.departureTime.text + " ";
				var timestamp = transitInfo.departureTime.time.getTime();
				var $countdown = $('<b class="time" time="'+timestamp+'"></b>');
				$countdown.text("(in " + transitInfo.departureTime.timeToDepartureInMinutes + " mins)");
				
				$departure.text(" at " + transitInfo.stop);
				$departure.prepend($countdown).prepend(timestring).prepend($transitline);
				
			} else if(mode == "WALKING") {
				$departure.text("Take " + transitInfo.duration.text + " to walk to " + transitInfo.destination);
			}
		} else {
			$departure.text("Data unavailable due to " + transitInfo.status + " :(");
		}
		
		$li.append($destination).append($triangle).append($departure);
		
		// If destination li does not exist
		if($("#"+destinationId+"").length == 0) {
			// Append it to the transit widget ul 
			$("#transit").prepend($li);
			
			// Everytime we append a new li element, it shifts the map down so we must adjust the map
			// height so that it fits.
			setMapHeight();	
		} else {		
			// If it does exist, replace it's contents with the now contents
			$("#"+destinationId+"").replaceWith($li);
		}
		
		if(mode == "WALKING") {
			setTimeout(function() {
				
				var now = new date();
				
				var destination = getDestinationByLocalName(transitInfo.destination);
				
				console.log(now+" Trying to find bus route instead of a walking route to "+ destination.localName);
			
				loadDirections(destination, now);
			}, 60*60*1000);
		}
	}
	
	var setMapMarker = function(position) {
			
		var latlong = new google.maps.LatLng(position.lat, position.lng);
		
		var marker = new google.maps.Marker({
			map: map,
			icon: "res/img/marker_bus.png",
			position: latlong
		});

	}
	
	// Get a destination given a query location
	var getDestinationByQueryLocation = function(queryLocation) {
		for(var i = 0; i < destinations.length; i++) {
			var destination = destinations[i];
			
			if(destination.queryLocation == queryLocation) {
				return destination;
			}
			
		}
		
		return null;
	}
	
	// Get a destination given a local name
	var getDestinationByLocalName = function(localName) {
		for(var i = 0; i < destinations.length; i++) {
			var destination = destinations[i];
			
			if(destination.localName == localName) {
				return destination;
			}
			
		}
		
		return null;
	}
	
	var loadDirections = function(destination, now) {
			
		var request = {
			origin: options.startingLoc,
			destination: destination.queryLocation,
			travelMode: google.maps.TravelMode.TRANSIT,
			provideRouteAlternatives: true,
			transitOptions : {
				departureTime: now
			}
		};
		
		// Query google for transit directions
		directionsService.route(request, function(result, status) {
			if (status == google.maps.DirectionsStatus.OK) {
								
				var destination = getDestinationByQueryLocation(result.Db.destination);
				
				if(destination == null) {
					return;
				}
				
				// Render directions on the Google Map
				var directionsDisplay = new google.maps.DirectionsRenderer();
				directionsDisplay.setMap(map);
				directionsDisplay.setDirections(result);
				
				// If there is a previously existing directions display, remove it from the map
				if(typeof destination.directionsDisplay != "undefined") {
					destination.directionsDisplay.setMap(null);
				}
				
				destination.directionsDisplay = directionsDisplay;
				
				// Use result to display the next transit time and stop					
				handleDirections(destination.localName, result);
				
				// Reposition the map after 2 seconds
				setTimeout(function() {
					repositionMap();
				}, 2000);
			}
		});
	}
	
	// Request google for directions to our list of destinations
	var loadDirectionsToAllDestinations = function() {
		
		// Get the current time to use as the departure time.
		var now = new Date();
		
		// Get directions from starting location to each destination in the array.
		for(var i = 0; i < destinations.length; i++) {
			var destination = destinations[i];
			
			loadDirections(destination, now);
			
			if(i == destinations.length-1) {
				
				// Reposition the map after 2 seconds
				setTimeout(function() {
					repositionMap();
				}, 2000);
			}
		}
	}
	
	/* 
		addDestination()
		@desc	Add a destination
		@params	localName - Short name of the location (Displayed in widget)
				queryLocation - Address of location or latitude/longitude values (Used to query google's api)
		@return	None
	*/
	var addDestination = function(localName, queryLocation) {
		destinations.push({
			localName: localName, 
			queryLocation: queryLocation
		});
	}
	
	// Reposition the map at the starting location zoomed in at street level
	var repositionMap = function() {
		console.log("Repositioning map");
		console.log(map.getZoom() +" == "+options.mapZoom);
		
		if(map.getZoom() != options.mapZoom) {
			map.setZoom(options.mapZoom);
		}
		
		if(map.getCenter() != mapCenter) {
			map.setCenter(mapCenter);
		}
	}
	
	// Set the map height based on the screen height
	var setMapHeight = function() {
	
		var mapCanvas = $('#transit #map #map_canvas');
		var map = $('#transit #map');
		var mapPadding = parseInt(map.css("padding-top")) + parseInt(map.css("padding-bottom"));
		var stocktickerOuterHeight = $("#stockticker").outerHeight(true);
	
		var mapHeight = $(window).height() - (mapCanvas.offset().top + stocktickerOuterHeight + mapPadding);
		map.height(mapHeight);
		
		// Adjust maxheight when resizing window.
		$(window).resize(function () {
			setMapHeight();
			repositionMap();
		});
	}
	
	// Update time remaining. If the time remaining has expired, then load a new transit direction.
	var updateTime = function() {
		$("#transit li[id^=transit]").each(function() {
			var $li = $(this);
			
			var $time = $li.find(".time");
			
			if($time.length != 0) {
				
				var timeStamp = parseInt($time.attr("time"));
				var now = new Date(),
					transitDeparture = new Date(timeStamp);
							
				var remainingTime = transitDeparture - now;			
				if(remainingTime >= 0) {
					
					var remainingTimeInMin = Math.round(remainingTime/1000/60);
					
					$time.text("(in " + remainingTimeInMin + " mins)");
				} else {
				
					var destinationLocalname = $li.find(".destination").text();
					
					console.log("Updating " + destinationLocalname + ". This trip has expired. Loading new trip.");
				
					var destination = getDestinationByLocalName(destinationLocalname);
					
					console.log(destinationLocalname);
				
					loadDirections(destination, now);
				}
			}

		});
	}
	
	var setup = function() {
		
		var mapOptions = {
			center: new google.maps.LatLng(0, 0),
			zoom: options.mapZoom,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
	
		map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    	
		geocoder.geocode({
			address: options.startingLoc
		}, function(results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
			
				mapCenter = results[0].geometry.location;
			
				map.setCenter(mapCenter);
				
				// Add a marker to show the starting location				
				var marker = new google.maps.Marker({
					map: map,
					position: mapCenter
				});
							
			} else {
				alert("Geocode was not successful due to: " + status);
			}
		});
		
		setInterval(function() {
			updateTime();
		}, 60*1000);

	}
	
	var setupOptions = function(opts) {
		$.extend(true, options, opts);
	}
	
	/*
		setStartingLocation()
		@desc	Set the starting location of all transit directions
		@param	loc - Starting location as an address or latitude/longitude values
		@return	None
	*/
	var setStartingLocation = function(loc) {
		options.startingLoc = loc;
	}
	
	return {
		// Public functions
	
		constructor: TransitWidget,
		setup: function(opts) {
			if(state.isSetup) {
				console.log("Is already setup!");
				return;
			}
			
			if(typeof opts != "undefined") {
				setupOptions(opts);
			}
			
			setup();
			
			state.isSetup = true;
		},
		loadDirectionsToAllDestinations: function() {
			loadDirectionsToAllDestinations();
		},
		addDestination: function(localName, queryLocation) {
			addDestination(localName, queryLocation);
		},
		setStartingLocation: function(loc) {
			setStartingLocation(loc);
		},
		getDestinations: function() {
			return destinations;
		},
		getMap : function() {
			return map;	
		},
		repositionMap: function() {
			repositionMap();
		},
		getStartingLocation: function() {
			return mapCenter;
		}
	}
})();

$(document).ready(function() {
	transitWidget = new TransitWidget();
	transitWidget.setup({
		startingLoc: "100 Front St W, Toronto, ON"
	});
	transitWidget.addDestination("Markham", "Markham, ON");
	transitWidget.addDestination("U of T", "University of Toronto, Toronto, ON");
	transitWidget.addDestination("City Hall", "City Hall, Toronto, ON");
	transitWidget.loadDirectionsToAllDestinations();
});