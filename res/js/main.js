function notdefined(variable) {
	return (typeof variable == "undefined");
}

var featuredimages = [];

// Adds a featured image to the featured image array it is not
// already in the array.
function addFeaturedImage(title, src) {
	for(var i = 0; i < featuredimages.length; i++) {
		if(featuredimages[i].src == src) {
			return;
		}
	}
	
	featuredimages.push({title: title, src: src});
}

// Cycle through the featured images
function cycleFeaturedImage() {

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

// Load images from 9Gag
function load9GagImage() {
	$.ajax({
		url: "http://infinigag.eu01.aws.af.cm/?section=hot&page=null",
		dataType: "json",
		timeout: 10000,
		success: function (data) {
			console.log(data);

			for (var i = 0; i < data.images.length; i++) {
				var img = data.images[i];
				var title = img.title;
				var src = img.image.big;
				
				addFeaturedImage(title, src);
			}

			cycleFeaturedImage();
		}
	});
}

// Load images from XKCD
function loadXKCDImage() {
	$.ajax({
		url: "http://dynamic.xkcd.com/api-0/jsonp/comic?callback=?",
		dataType: "json",
		jsonpCallback: "xkcddata",
		success: function (data) {
			featuredimages.push(data.img);
			
			addFeaturedImage("XKCD - "+data.safe_title, data.img);
		}
	});
}

// Set maxheight of image based on window dimensions
function setFeaturedImageMaxHeight() {
	var maxHeight = $(window).height() - ($("#ticker").outerHeight(true) + 10) - $("#stockticker").outerHeight(true);

	$("#featuredimage").css("max-height", maxHeight + "px");

	// Adjust maxheight when resizing window.
	$(window).resize(function () {
		setFeaturedImageMaxHeight();
	});
}

function setupFeatureImage() {
	$(document).ready(function() {
		setFeaturedImageMaxHeight();
		loadXKCDImage();
		load9GagImage();
		
		// Load new featured images every 30 min
		setInterval(function() {
			loadXKCDImage();
			load9GagImage();
		}, 30*60*1000);
		
		// Cycle through featured image every minute.
		setInterval(cycleFeaturedImage, 1*60*1000);
	});
}

$(document).ready(function () {

	// Check if the user's web browser supports HTML5 Speech Input API
	if (document.createElement('input').webkitSpeech == undefined) {
		$(".answer").append("We are sorry but Dictation requires Google Chrome.");
	} else {

		// Get the default locale of the user's browser (e.g. en-US, or de)
		var language = window.navigator.userLanguage || window.navigator.language;
		$("#speech").attr("lang", language).focus();

		// Make the text region editable to easily fix transcription errors
		$(".answer").click(function () {
			$('.answer').attr('contentEditable', 'true');
		});
	}

	// This is called when Chrome successfully transcribes the spoken word
	$("#speech").bind("webkitspeechchange", function (e) {
		var val = $(this).val();

		if (val.match(/(next|image|9gag|nine gag|ninegag|9 gag|trending)/g)) {
			cycleFeaturedImage();
		} else if (val.match(/weather/g)) {
			weatherWidget.update();
		}

		// Append the transcribed text but set the focus to the hidden speech input.
		// This enables keyboard shortcut Ctrl+Shift+Period (.) for speech mode.
		$(".answer").append(val + " ").fadeIn();
		$(this).val("").focus();
	});
});