
var twitterTickerWidget;

function TwitterTicker(){} 

TwitterTicker.prototype = (function() {
	
	// Options that can be customized through the setup() method
	var options = {
		time: {
			ticker: 6*1000,	// Move tweets every 6s
			loadNewTweets: 5*60*1000, // Load new tweets every 5 min
			timeStampUpdate: 60*1000, // Update timestamp (x time ago) of tweets every min
			cleanupOldTweets: 30*60*1000 // Every 30min run cleanup. That is: schedule for removal the oldest tweets, until only options.maxTweets number of tweets remain.
		},
		maxTweets: 40,
		debug: false
	};
	
	// State of the widget. Cannot be modified outside the scope of the widget.
	var state = {
		lastTweetTime: 0,
		isSetup: false
	}
	
	var debugMsg = function(msg) {
		if(options.debug) {
			console.debug(msg);
		}
	}
	
	var tick = function(){
		$('#ticker li:first')
		.addClass("sliding")
		.addClass("animated flipOutX")
		.slideUp(function () {
		
			var $tweet = $(this);
		
			// If this tweet is scheduled for cleanup,
			// do not append it back to the end of the list.
			if($tweet.attr("cleanup")) {
				// Remove this tweet
				$tweet.remove();
				return;
			}
		
			$tweet.appendTo($('#ticker')).slideDown(function(){ 
				$(this).removeClass("sliding")
				.removeClass("animated flipOutX"); 
			});
		});
	}
	
	var timeAgo = function(dateString) {
		var rightNow = new Date();
	    var then = new Date(dateString);
	     
	    if ($.browser.msie) {
	        // IE can't parse these crazy Ruby dates
	        then = Date.parse(dateString.replace(/( \+)/, ' UTC$1'));
	    }
	
	    var diff = rightNow - then;
	
	    var second = 1000,
	    minute = second * 60,
	    hour = minute * 60,
	    day = hour * 24,
	    week = day * 7;
	
	    if (isNaN(diff) || diff < 0) {
	        return ""; // return blank string if unknown
	    }
	
	    if (diff < second * 2) {
	        // within 2 seconds
	        return "right now";
	    }
	
	    if (diff < minute) {
	        return Math.floor(diff / second) + " s ago";
	    }
	
	    if (diff < minute * 2) {
	        return "1 m ago";
	    }
	
	    if (diff < hour) {
	        return Math.floor(diff / minute) + " m ago";
	    }
	
	    if (diff < hour * 2) {
	        return "1 hr ago";
	    }
	
	    if (diff < day) {
	        return  Math.floor(diff / hour) + " hrs ago";
	    }
	
	    if (diff > day && diff < day * 2) {
	        return "yesterday";
	    }
	
	    if (diff < day * 365) {
	        return Math.floor(diff / day) + " days ago";
	    }
	
	    else {
	        return "over a year ago";
	    }
	}
	
	var timeStampUpdate = function() {
		$("#ticker li .timestamp").each(function() {
			var timestampElement = $(this);
			var timestamp = timestampElement.attr("time");
			
			var newTimestamp = timeAgo(timestamp);
			
			timestampElement.text(newTimestamp);
		});
	} 
	
	var loadTweets = function() {
		$.ajax ({
			 //url: 'https://api.twitter.com/1/statuses/user_timeline.json',
			 url: 'https://api.twitter.com/1/lists/statuses.json?slug=news&owner_screen_name=chanbobby1&include_entities=true',
			 data: {
				 slug : "news",
				 owner_screen_name: "chanbobby1",
				 include_entities: true
			 },
			 dataType: 'jsonp',
			 timeout: 10000,
			 success: function(data) {
			 	if (!data){
			 		return false;
			 	}
			 	
			 	debugMsg(data);
			 	
			 	var newestTweetInAjaxRequest = 0;
			 	
			 	for( var i in data){
			 		var result = data[i];
			 		var $res = $("<li />");
			 		var $table = $("<table />");
			 		var $tr = $("<tr />");
			 		
			 		
			 		// Add profile picture
			 		var $pic = $('<a target="_blank" href="http://twitter.com/' + result.user.screen_name + '" /a>');
			 		$pic.append('<img style="vertical-align:top" src="' + result.user.profile_image_url + '" />');
			 		var $td1 = $("<td valign=\"top\" />");
			 		$td1.append($pic);
			 		// Add timestamp under profile picture
			 		var $timestamp = $('<div class=\"timestamp\" time="'+result.created_at+'">'+timeAgo(result.created_at)+'</div>');
			 		// Profile picture and stamp go in the left table cell
			 		$td1.append($timestamp);
			 		$tr.append($td1);
			 		
			 		var tweet = result.text;
			 		// Add URLS to links
			 		tweet = tweet.replace(/(https?:\/\/*.[^\s]+)/g, "<a target=\"_blank\" href=\"$1\"><tag>$1</tag></a>");
			 		// Add URLS to #hashtags
			 		tweet = tweet.replace(/#(\w+)/g, "<a target=\"_blank\" href=\"https://twitter.com/search?q=%23$1&src=hash\"><s>#</s><tag>$1</tag></a>");
			 		// Add URLS to @references
			 		tweet = tweet.replace(/@(\w{1,15})/g, "<a target=\"_blank\" href=\"http://twitter.com/$1\"><s>@</s><tag>$1<tag/></a>");
			 		
			 		var $container = $("<p />");
			 		$container.html(tweet);
			 		
			 		var $td2 = $("<td valign=\"top\" />")
			 		// Tweet goes in right table cell
			 		$td2.append($container);
			 		// Put cell2 in table row
			 		$tr.append($td2);
			 		// Put tablerow in table
			 		$table.append($tr);
			 		// Put table in list li
			 		$res.append($table);
			 		
			 		
			 		// Get creation time of tweet
			 		var creationTime = new Date(Date.parse(result.created_at));
			 		// If this tweet is the newest of all the tweets in the ajax request
			 		if(creationTime > newestTweetInAjaxRequest) {
				 		newestTweetInAjaxRequest = creationTime;
			 		}
			 		
			 		var now = new Date();
			 		
			 		var nowString = (now.getHours()+1)+":"+(now.getMinutes()+1);
			 		
			 		// Only add to widget if the tweet is new since the last time we checked
			 		if(creationTime > state.lastTweetTime) {
				 		$res.appendTo($('#ticker'));
				 		
				 		debugMsg(nowString + " New tweet: " + tweet);
				 		
			 		} else {
			 			
			 			debugMsg(nowString + " Tweet is not new, ignoring: " + tweet);
			 			
			 		}
			 	}
			 	
			 	// If the newest tweet in the ajax request is newer than the existing tweets since the last time we checked
			 	if(newestTweetInAjaxRequest > state.lastTweetTime) {
				 	state.lastTweetTime = newestTweetInAjaxRequest;
			 	}
			 }
		});
	}
	
	// Get the oldest tweet from the tweets that are not to be cleaned up
	var getOldestTweet = function() {
		var oldestTweet,
			oldestTweetTimeStampDate = new Date();
	
		// For each tweet that doens't have the cleanup attribute
		$('#ticker li:not([cleanup="true"])').each(function() {
			var $tweet = $(this);
			
			// Get timestamp of tweet
			var timestampString = $tweet.find(".timestamp").attr("time");
			var timestampDate = new Date(Date.parse(timestampString));
			var tweetText = $tweet.find("p").text();
			
			//console.log(timestampDate + "- " + tweetText);
			
			// If there is no oldest tweet, set this one as the oldest
			// or if this tweet is older than the current oldest tweet
			
			if(notdefined(oldestTweet) || timestampDate < oldestTweetTimeStampDate) {
				oldestTweet = $tweet;
				oldestTweetTimeStampDate = timestampDate;
			}
		});
		
		return oldestTweet;
	}
	
	// Get the number of tweets that are not to be cleaned up
	var getNumTweets = function() {
		return $('#ticker li:not([cleanup="true"])').length;
	}
	
	// Removes the oldest tweets until there is only 20 remaining.
	var cleanupOldTweets = function() {
	
		var now = new Date();
		var nowString = (now.getHours()+1)+":"+(now.getMinutes()+1);
	
		var numTweets = getNumTweets();
	
		console.debug(nowString+" Cleaning up oldest tweets");
		console.debug(nowString+" There are currently " + numTweets + " tweets");
		
		// Cleanup tweets until there are only maxTweets tweets left.
		while(getNumTweets() > options.maxTweets) {
			
			// Get the oldest tweet.
			var $oldestTweet = getOldestTweet();
			console.log($oldestTweet);
			// Set a cleanup attribute for the oldest tweet
			$oldestTweet.attr("cleanup", true);
		}
		
		console.debug(nowString+" After cleanup there are " + getNumTweets() + " tweets");
	}
	
	var setup = function() {
	
		if(state.isSetup) {
			console.log("Can only setup once!");
			return;
		}
	
		loadTweets();
		
		// Move tweet ticker every 6 seconds
		setInterval(function(){ tick() }, options.time.ticker);
		// Load new tweets every 5 minutes
		setInterval(function(){ loadTweets() }, options.time.loadNewTweets);
		// Update timestamps every minute
		setInterval(function(){ timeStampUpdate() }, options.time.timeStampUpdate);
		// Cleanup oldest tweets every 30 min
		setInterval(function(){ cleanupOldTweets() }, options.time.cleanupOldTweets);
		
		state.isSetup = true;
	}
	
	var setOptions = function(newOptions) {
		$.extend(true, options, newOptions);
	}
	
	return {
		constructor : TwitterTicker,
		setup : function(opts) {
		
			if(typeof opts != "undefined") {
				setOptions(opts);
			}
		
			setup();
		}
	};
})();

$(document).ready(function() {
	twitterTickerWidget = new TwitterTicker();
	//twitterTickerWidget.setup({debug: true});
	twitterTickerWidget.setup();
});