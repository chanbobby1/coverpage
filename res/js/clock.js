var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]; 
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

var clockWidget;

function Clock(){} 

Clock.prototype = (function() {

	var options = {
		format24Hr: false
	}

	var dateElement,
		timeElement;

	var getSpecialDate = function(date) {
		
		switch(date.getMonth()+1) {
			case 12:
				switch(date.getDate()) {
					case 25: return "Christmas"; break;
					case 26: return "Boxing Day"; break;
				}
			break;
		}
		
	}

	var display = function(date) {
		var dateText = days[date.getDay()] + ", " + date.getDate() + " " + months[date.getMonth()];
		
		
		
		dateElement.text(dateText);
		
		var hours = date.getHours();
		var hour = ( (options.format24Hr)? hours : ((hours <= 12)? hours : (hours-12)) );
		
		var mins = date.getMinutes();
		var minute = ((mins<10)? "0" : "") + mins;
		
		var secs = date.getSeconds();
		var seconds = ((secs<10)? "0" : "") + secs;
		
		var time = hour + ":" + minute + ":" + seconds;
		
		if(!options.format24Hr) {
			time += " ";
			time += (hours<12)? "AM" : "PM";
		}
		
		timeElement.text(time);
	}
	
	var update = function() {
		display(new Date());
	}

	var setup = function() {
		
		var clockDiv = $('<div id="clock"></div>');
		dateElement = $('<div id="date"></div>');
		timeElement = $('<div id="time"></div>');
		
		clockDiv.append(dateElement);
		clockDiv.append(timeElement);
		
		$("body").prepend(clockDiv);
	}

	return {
		constructor : Clock,
		setup : function() {
			setup();
			
			update();
			setInterval(function(){ update() }, 1000);
		},
		update : function() {
			update();
		}
	};

})();

$(document).ready(function() {
	clockWidget = new Clock();
	clockWidget.setup();
});
