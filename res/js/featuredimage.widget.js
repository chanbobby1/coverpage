var imageFeeds = [
	{
		url: "http://dynamic.xkcd.com/api-0/jsonp/comic?callback=?",
		jsonpCallback: "xkcddata",
		parser: function(data) {
			return [{title: "XKCD - "+data.safe_title, src: data.img}];
		}
	},
	{
		url: "http://infinigag.eu01.aws.af.cm/?section=hot&page=null",
		parser: function(data) {
			var images = [];
			for (var i = 0; i < data.images.length; i++) {
				var img = data.images[i];
				var title = img.title;
				var src = img.image.big;
				
				images.push({title: title, src: src});
			}
			return images;
		}
	},
	{
		url: "http://infinigag.eu01.aws.af.cm/?section=trending&page=null",
		parser: function(data) {
			var images = [];
			for (var i = 0; i < data.images.length; i++) {
				var img = data.images[i];
				var title = img.title;
				var src = img.image.big;
				
				images.push({title: title, src: src});
			}
			return images;
		}
	}
	
];


var trendingImageWidget;

function FeaturedImageWidget(){}

FeaturedImageWidget.prototype = (function() {

	var options = {
		maxImages: 50,
		time : {
			loadNewImages : 30*60*1000,
			cycleImage: 1*60*1000
		},
		feeds: []
	};
	
	var state = {
		isSetup: false	
	};

	var featuredimages = [];
	
	var isValidURL = function(url) {
		var urlexp = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);
    	
    	return (urlexp.test(url));
   	}
	
	// Adds a featured image to the featured image array it is not
	// already in the array.
	var addFeaturedImage = function(title, src) {
		// Check if image is already in the array
		for(var i = 0; i < featuredimages.length; i++) {
			if(featuredimages[i].src == src) {
				return;
			}
		}
		
		// Check if there are more than options.maxImages
		if(featuredimages.length >= options.maxImages) {
			// If there are, then remove the oldest one
			removeOldestImage();
		}
		
		// Then add this one
		var timeAdded = new Date();
		
		featuredimages.push({title: title, src: src, timeStamp: timeAdded});
	}
	
	var removeOldestImage = function() {
		var oldestImage = featuredimages[0];
		var oldestTime = oldestImage.timeStamp;
				
		// Check if image is already in the array
		for(var i = 0; i < featuredimages.length; i++) {
		
			var img = featuredimages[i];
		
			if(img.timeStamp < oldestTime) {
				oldestTime = img.timeStamp;
				oldestImage = img;
			}
		}
		
		featuredimages.remove(img);
	}
	
	// Cycle through the featured images
	var cycleFeaturedImage = function() {
	
		if (notdefined(featuredimages) || featuredimages.length == 0) {
			return;
		}
	
		var img = featuredimages[0];
		
		var title = img.title;
		
		$(".featuredimagelabel").fadeOut();
		$(".featuredimageContainer").fadeOut(function () {
			var $img = $(this).find("#featuredimage").attr("src", img.src);
			
			if(notdefined($img.attr("src"))) {
			
				// Didn't load properly
				
				
				return cycleFeaturedImage();
			}
			
			$(this).find(".title").text(title);
			$(".featuredimagelabel").fadeIn();
			$(this).fadeIn();
		});
	
		featuredimages.shift();
	
		featuredimages.push(img);
	}
	
	/*
		loadImageFeed()
		@desc 	Loads an image feed
		@params	string url - The URL to retrive images from. It must return a JSON object.
				function parseData(data) - A callback function that accepts a data 
				object (JSON object from URL) and converts it to an array of the form:
				[{title: "Image title", src: "http://example.com/image.jpg"}]
	
	*/
	var loadImageFeed = function(url, jsonpCallback, parseData, onComplete) {
		$.ajax({
			url: url,
			dataType: "json",
			timeout: 10000,
			jsonpCallback: jsonpCallback,
			success: function (data) {	
				var images = parseData(data);
	
				if(typeof images != "object" || typeof images.length != "number") {
					console.log("Callback function did not return an array!");
					return;
				}
	
				for (var i = 0; i < images.length; i++) {
					
					var img = images[i];
					
					if(typeof img != "object") {
						console.log("Not an object!");
						console.log(img);
						
						continue;
					}
					
					var title = img.title;
					var src = img.src;
					
					if(typeof img.title == "undefined" || typeof img.src == "undefined") {
						console.log("Object at index " + i + " is missing title and/or src property!");
						console.log(img);
						
						continue;
					}
					
					if(!isValidURL(img.src)) {
						console.log(img.src + " is not a valid URL!");
						continue;
					}
					
					addFeaturedImage(title, src);
				}
				
				if(typeof onComplete == "function") {
					onComplete();
				}
			}
		});
	}
	
	var loadImageFeeds = function() {
	
		if(typeof options.feeds.length != "number") {
			console.log("options.feeds is not an array!");
			return;
		}
	
		for(var i = 0; i < options.feeds.length; i++) {
			var feed = options.feeds[i];
			
			var url = feed.url;
			var jsonpCallback = feed.jsonpCallback;
			var parserFunction = feed.parser;
			
			if(!isValidURL(url)) {
				console.log(url + " is not a valid URL!");
				continue;
			}
			
			if(typeof parserFunction != "function") {
				console.log("parser attribute must be a function!");
				continue;
			}
			
			if(i != options.feeds.length-1) {
				loadImageFeed(url, jsonpCallback, parserFunction);
			} else {
			// After finishing loading the last feed, cycle the featured image
				loadImageFeed(url, jsonpCallback, parserFunction, function() {
					cycleFeaturedImage();
				});
			}
		}
	}
	
	// Set maxheight of image based on window dimensions
	var setFeaturedImageMaxHeight = function() {
		var maxHeight = $(window).height() - ($("#ticker").outerHeight(true) + 10) - $("#stockticker").outerHeight(true);
	
		$(".featuredimageContainer").css("max-height", maxHeight + "px");
		
		var featuredImageMaxHeight = maxHeight - $(".featuredimageContainer .title").outerHeight();	
		$("#featuredimage").css("max-height", featuredImageMaxHeight + "px");
	
		// Adjust maxheight when resizing window.
		$(window).resize(function () {
			setFeaturedImageMaxHeight();
		});
	}
	
	var setup = function() {
	
		if(state.isSetup) {
			console.log("Is already setup!");
			return;
		}
	
		// Set the max height of the featured image element
		setFeaturedImageMaxHeight();
		// Load image feeds
		loadImageFeeds();
		
		// Load new featured images every 30 min
		setInterval(function() {
			loadImageFeeds();
		}, options.time.loadNewImages);
		
		// Cycle through featured image every minute.
		setInterval(cycleFeaturedImage, options.time.cycleImage);
				
		state.isSetup = true;
	}

	var setupOptions = function(opts) {
		$.extend(true, options, opts);
	}

	return {
		constructor: FeaturedImageWidget,
		setup: function(opts) {
			if(typeof opts != "undefined") {
				setupOptions(opts);
			}
			
			setup();
		},
		next: function() {
			cycleFeaturedImage();
		},
		addImageFeed: function(url, jsonpCallback, parser) {
			options.feeds.push({
				url: url,
				jsonpCallback:jsonpCallback,
				parser: parser
			});
		},
		getFeaturedImages: function() {
			return featuredimages;
		}
	}

})();

$(document).ready(function() {
	trendingImageWidget = new FeaturedImageWidget();
		
	trendingImageWidget.setup({feeds: imageFeeds});
	
	$("#featuredimage").click(function() {
		trendingImageWidget.next();
	});

});