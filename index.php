<!DOCTYPE HTML>

<?php

	$bg = "milky_way_sky-1920x1080.jpg";

	$GOOGLE_API_KEY = "AIzaSyAAc16615kw98ZLpwRZhckJkhO-A55Xd-c";

	$scripts = array(
		"res/js/less-1.3.1.min.js",
		"res/js/jquery-1.8.3.min.js",
		"res/js/modernizr.js",
		"res/js/main.js",
		"res/js/weather.js",
		"res/js/twitterticker.js",
		"res/js/jquery.ticker.js",
		"res/js/stockticker.js",
		"res/js/clock.js",
		"res/js/featuredimage.widget.js",
		"https://maps.googleapis.com/maps/api/js?key=".$GOOGLE_API_KEY."&sensor=false",
		"res/js/transit.widget.js"
	);
	
	$stylesheets = array(
		"res/css/main.css",
		"http://fonts.googleapis.com/css?family=Raleway+Dots",
		"http://fonts.googleapis.com/css?family=Titillium+Web:400,600,300",
		"res/css/weather.css",
		"res/css/animate.css",
		"res/css/clock.css"
	);
	
	$lesssheets = array(
		"res/css/twitterticker.less",
		"res/css/stockticker.less",
		"res/css/featuredimage.widget.less",
		"res/css/transit.widget.less"
	);
?>

<html>
	<head>
		<title>CoverPage</title>
		<!-- CSS -->
		<?php
		foreach($stylesheets as $css) {
			echo '<link rel="stylesheet" type="text/css" href="'.$css.'" />'.PHP_EOL;
		}
		foreach($lesssheets as $less) {
			echo '<link rel="stylesheet/less" type="text/css" href="'.$less.'" />'.PHP_EOL;
		}
		?>
		<!-- JS -->
		<?php
		foreach($scripts as $script) {
			echo '<script type="text/javascript" src="'.$script.'"></script>'.PHP_EOL;
		}
		?>
		<style>
			html {
				/*background-image: -webkit-linear-gradient(rgba(255,255,255,0) 0%, rgba(89,253,255,0.64) 100%);*/
				background-image: url(res/img/<?php echo $bg; ?>);
			}
		</style>
		<script>
		</script>
	</head>
	<body>
	
		<ul id="transit" class="ticker">
			<div class="tickerbottom"></div>
			<li id="map">
				<div id="map_canvas"></div>
			</li>
		</ul>
	
		<!--<div class="speech-modal">
			<div class="speech-wrapper">
		      <input type="speech" id="speech" x-webkit-speech />
		    </div>
		    <!--<div class="answer"></div>-->
		<!--</div>-->
		
		<!-- CTV News Video feed -->
		<!--<div class="videofeed">
			<div class="iframecontainer">
				<iframe src="http://www.ctvnews.ca/video" frameborder="0" marginheight="0" marginwidth="0" scrolling="no"></iframe>
			</div>
		</div>-->
		
		<ul id="ticker" class="ticker">
			<div class="tickerbottom"></div>
		</ul>
		
		<p class="featuredimagelabel">Trending Image</p>
		<div class="featuredimageContainer">
			<div class="title"></div>
			<img id="featuredimage"></img>
		</div>
	</body>
	<script>
		$(document).ready(function() {
		});
	</script>
	<script type="text/javascript">

	  var _gaq = _gaq || [];
	  _gaq.push(['_setAccount', 'UA-23783720-5']);
	  _gaq.push(['_trackPageview']);
	
	  (function() {
	    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
	  })();
	
	</script>
</html>