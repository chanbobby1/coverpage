if(typeof jQuery == "undefined") {
	alert("jQuery is required for weather.js!");
}

if(typeof Modernizr == "undefined") {
	alert("Modernizr is required for weather.js!");
}

var weatherWidget;

function Weather(){} 

Weather.prototype = (function() {

	var options = {
	    api_key_weatherunderground: "8e4b48e43b944141",
	    weather_celcius: true,
	    updateInterval: 60*60*1000
	};
	
	
	var last = {
		query : "", // The last query used to get the weather. Could be "lat,long" or "autoip"
		update : 0,
		icon : "",
		forecast : "",
		alert : ""	
	};

	// Display weather method. Parses data object from WeatherUnderground and displays the weather
	var displayWeather = function (data) {
	
		var changed = false;
	
	    var weatherWidget = $(".weather");
	
	    if (notdefined(data) || notdefined(data.current_observation) || notdefined(data.location)) {
	        $("#weather_icon").css("background-image", "url(res/img/weather_icons/unavailable.png)");
	
	
	        $("#weather_forecast").text("Weather unavailable");
	
	        weatherWidget.fadeIn(300);
	        return;
	    }
	
	    var currentConditions = data.current_observation;
	    var alerts = data.alerts;
	
	    // Only update if there are changes
	    if(last.icon != currentConditions.icon) {
	    	$("#weather_icon").fadeOut().css("background-image", "url(res/img/weather_icons/" + currentConditions.icon + ".png)").fadeIn(300);
	    	last.icon = currentConditions.icon;
	    	
	    	changed = true;
	    }
	
	    var condition = currentConditions.weather + ", ";
	    condition += (options.weather_celcius) ? (currentConditions.windchill_c + " C") : (currentConditions.windchill_f + " F");
	
	    if(last.condition != condition) {
	    	$("#weather_forecast").fadeOut().text(condition).fadeIn(300);
	    	last.condition = condition;
	    	changed = true;
	    }
	
	    $("#weather_location").html("<small>in</small> <b>" + data.location.city + "</b>, <small>" + data.location.state + "</small>");
	
	    // Display alert message
	    var alertMessage = "";
	    if (alerts.length > 0) {
	        for (var i = 0; i < alerts.length; i++) {
	            var alert = alerts[i];
	            var UTCdatetime = parseInt(alert.date_epoch);
	            console.log(UTCdatetime);
	            var dateIssued = new Date();
	            dateIssued.setUTCSeconds(UTCdatetime);
	            alertMessage += alert.description;
	            if (i != length - 1) {
	                alertMessage += "<br>";
	            }
	        }
	    }
	    
	    if(last.alert != alertMessage) {
	    	$("#weather_alert").fadeOut().html(alertMessage).fadeIn();
	    	last.alert = alertMessage;
	    	changed = true;
	    }	    
	    last.update = new Date();
	    
		setInterval(function() {update()}, options.updateInterval);
	};
	
	// Lookup weather based on query and display it
	var lookupAndDisplayWeather = function(query) {
	
		// Store query so next time we don't have to request the geolocation again
		last.query = query;
	
	    var url = "http://api.wunderground.com/api/" + options.api_key_weatherunderground + "/geolookup/conditions/forecast/alerts/q/" + query + ".json";
	    $.ajax({
	        url: url,
	        dataType: "jsonp",
	        type: "get",
	        crossDomain: true,
	        success: function (data) {
	            console.log(data);
	            
	            displayWeather(data);
	        }
	    });
	}
	
	// Get the weather by geolocation
	var getWeatherByPosition = function(position) {
	    var latitude = position.coords.latitude;
	    var longitude = position.coords.longitude;
	
	    lookupAndDisplayWeather(latitude + "," + longitude);
	}
	
	// Catch geolocation request errors. If geolocation is not provided or supported, use IP address
	var geolocationRequestError = function() {
	    lookupAndDisplayWeather("autoip");
	}
	
	var setupHTML = function() {
		var weather = $("body").prepend('<div class="weather"></div>').find(".weather");
		var left = weather.prepend('<div class="left"></div>').find(".left");
		left.prepend('<div id="weather_icon"></div>');
		left.prepend('<div id="weather_location"></div>');
		var right = weather.append('<div class="right"></div>').find(".right");
		right.append('<div id="weather_forecast"></div>');
		right.append('<div id="weather_alert"></div>');
	}
	
	var requestGeolocation = function() {
		if (Modernizr.geolocation) {
	        navigator.geolocation.getCurrentPosition(getWeatherByPosition, geolocationRequestError);
	    } else {
	        geolocationRequestError();
	    }
	}
	
	// Setup weather widget by inserting html elements and requesting the user's geolocation
	var setup = function() {
	
		setupHTML();
		requestGeolocation();
	}
	
	var update = function() {
		if(notdefined(last.update) || notdefined(last.query)) {
			setup();
		} else {
		
			var now = new Date();
			
			var elaspedMS = (now - last.update);
			
			if(elaspedMS >= options.updateInterval) {
				
				lookupAndDisplayWeather(last.query);
			}
		}
	}
		
	return {
		constructor : Weather,
		setup : function() {
			setup();
		},
		update : function() {
			update();
		}
	};
	
})();

$(document).ready(function() {
	weatherWidget = new Weather();
	weatherWidget.setup();
});