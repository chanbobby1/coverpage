var lastTweetTime = 0;
var maxTweets = 20;

function tick(){
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

function timeAgo(dateString) {
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

function timeStampUpdate() {
	$("#ticker li .timestamp").each(function() {
		var timestampElement = $(this);
		var timestamp = timestampElement.attr("time");
		
		var newTimestamp = timeAgo(timestamp);
		
		timestampElement.text(newTimestamp);
	});
} 

function loadTweets() {
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
		 	
		 	console.log(data);
		 	
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
		 		if(creationTime > lastTweetTime) {
			 		$res.appendTo($('#ticker'));
			 		console.log(nowString + " New tweet: " + tweet);
		 		} else {
		 			console.log(nowString + " Tweet is not new, ignoring: " + tweet);
		 		}
		 	}
		 	
		 	// If the newest tweet in the ajax request is newer than the existing tweets since the last time we checked
		 	if(newestTweetInAjaxRequest > lastTweetTime) {
			 	lastTweetTime = newestTweetInAjaxRequest;
		 	}
		 }
	});
}

// Get the oldest tweet from the tweets that are not to be cleaned up
function getOldestTweet() {
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
function getNumTweets() {
	return $('#ticker li:not([cleanup="true"])').length;
}

// Removes the oldest tweets until there is only 20 remaining.
function cleanupOldTweets() {

	var now = new Date();
	var nowString = (now.getHours()+1)+":"+(now.getMinutes()+1);

	var numTweets = getNumTweets();

	console.debug(nowString+" Cleaning up oldest tweets");
	console.debug(nowString+" There are currently " + numTweets + " tweets");
	
	// Cleanup tweets until there are only maxTweets tweets left.
	while(getNumTweets() > maxTweets) {
		
		// Get the oldest tweet.
		var $oldestTweet = getOldestTweet();
		console.log($oldestTweet);
		// Set a cleanup attribute for the oldest tweet
		$oldestTweet.attr("cleanup", true);
	}
	
	console.debug(nowString+" After cleanup there are " + getNumTweets() + " tweets");
}

function setupTwitterWidget() {
	loadTweets();
	
	// Move tweet ticker every 6 seconds
	setInterval(function(){ tick() }, 6*1000);
	// Load new tweets every 5 minutes
	setInterval(function(){ loadTweets() }, 5*60*1000);
	// Update timestamps every minute
	setInterval(function(){ timeStampUpdate() }, 60*1000);
	// Cleanup oldest tweets every 30 min
	setInterval(function(){ cleanupOldTweets() }, 30*60*1000);
}

$(document).ready(function() {
	setupTwitterWidget();
});