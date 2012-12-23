
var stockTickerWidget;

function StockTicker(){} 

StockTicker.prototype = (function() {

	var stockticker;
	
	var options = {
		symbols: [],
		time: {
			loadQuotes: 30*1000, // Refresh quotes every 30 seconds
			scrollSpeed: 120 // Speed of ticker scroller in pixels per second
		}
	};
	
	var state = {
		isSetup : false
	};
	
	// Fix float to a certain precision of decimal points
	var toFixed = function(value, precision) {
	
		if(isNaN(precision)) {
			return String(value);
		}
	
	    var power = Math.pow(10, precision || 0);
	    var fixed = String(Math.round(value * power) / power);
	    
	    if(precision == 0) {
		    return fixed;
	    }
	    
	    if(fixed.indexOf(".") == -1) {
		    fixed += ".";
	    }
	    
	    var expectedStringLength = String(value).replace(/\..+/, "").length + 1 + precision;
	   
	    // If not enough decimal places, add more until we have the right amount
	    // (eg. value=270.4 precision=2 ==> 270.40)
	    // (eg. value=270 precision=2 ==> 270.00)
	    // (eg. value=270.46 precision=2 ==> 270.46)
	    if(fixed.length < expectedStringLength) {
		    for(var i = 0, l = expectedStringLength-fixed.length; i < l; i++) {
		    	fixed += "0";
		    }
	    }
	    
	    return fixed;
	}
	
	// Display stock quotes from ajax call to Yahoo Finance API
	var displayQuotes = function(quotes) {
		var $ticker = $("#stockticker ul");
		
		var listingHtml = [];
		
		for(var i = 0; i < quotes.length; i++) {
			var quote = quotes[i];
			
			// Ignore Symbols that we couldn't find
			if(quote.symbol == "N/A") {
				continue;
			}
			
			var symbolId = (quote.symbol.replace(/\./g, "_").replace(/:/g, "_"));
			
			var elementId = "ticker_stockquote_"+symbolId;
			var $listing = $('<li></li>');
			$listing.attr("id", elementId)
			.attr("time", quote.time)
			.attr("symbol", symbolId);
			
			var quotePrice = parseFloat(quote.price);
			var priceChange = parseFloat(quote.changeprice);
			
			// Get state class and symbol (Up, Down, Right) from the quote's pricechange
			var state = "up",
				symbol = "&#9650;";
		
			if(priceChange < 0) {
				state = "down";
				symbol = "&#9660;"
			} else if(priceChange == 0 || isNaN(priceChange)) {
				state = "nochange";
				symbol = "&#9658;";
			} else if(priceChange > 0) {
				state = "up";
				symbol = "&#9650;";
			}
			
			var percentchg = quote.changepercent.replace(/[-+]/g, "");
			var pricechg = quote.changeprice.replace(/[-+]/g, "");
			
			listingHtml[i] = quote.symbol + ' '+toFixed(quote.price,2)+' <span class="'+state+'">'+toFixed(Math.abs(priceChange),2)+' '+symbol+' '+percentchg+'</span>';
			
			
			$listing.html(listingHtml[i]);
			
			
			// Check if the listing is already in the ticker
			var existingListing = $ticker.find('li[symbol="'+symbolId+'"]');
			if(existingListing.length == 0) {
				// Listing is not in the ticker
				
				// Add listing to ticker
				stockticker.addMsg($listing);
				
			} else {
				// Listing already exists in the ticker, update it's value
			
				// Each listing can have more than one duplicate of itself
				// so that the ticker strip is long enough to fill the screen
				existingListing.each(function() {
				
					var listing = $(this);
				
					var existingListingHtml = listing.html();
					
					// Decode special html characters
					existingListingHtml = existingListingHtml.replace(/▲/g, "&#9650;").replace(/▼/g, "&#9660;").replace(/►/g, "&#9658;");
					
					// If new listing is different from old listing
					// (ie. price changes)
					if(existingListingHtml != listingHtml[i]) {
						
						// Store the index of the listingHtml in the array so then when fadeout is finished, we can retrieve the index
						listing.data("listingId", i)
						// Fadeout animation
						.fadeOut(300, function() {
							
							// Get index of listingHtml
							var i = $(this).data("listingId");
							// Update listing with new lisitnghtml
							$(this).html(listingHtml[i])
							// Fadein animation
							.fadeIn();
							
							//console.log($(this).attr("symbol") + " updated!");
						});
					
					} // END if
				
				});
			}
		}
		
		if(!stockticker.isScrolling()) {
			stockticker.start();
		}
	}
	
	// Load quotes by sending an ajax call to Yahoo's Finance API, 
	// then display the quotes.
	var loadQuotes = function() {
	
		var stocklist = "";
		// Create comma seperated list of stock symbols
		for(var i = 0; i < options.symbols.length; i++) {
			stocklist += options.symbols[i];
			if(i != options.symbols.length-1) {
				stocklist += ",";
			}
		}
	
		// Send ajax request to API
		$.ajax({
			url: 'http://query.yahooapis.com/v1/public/yql',
			data: {
				q : "select * from csv where url='http://download.finance.yahoo.com/d/quotes.csv?s="+stocklist+"&f=sl1d1t1c1p2ohgv&e=.csv' and columns='symbol,price,date,time,changeprice,changepercent,open,high,low,volume'",
				format: "json"
			},
			dataType: 'jsonp',
			timeout: 10000,
			success: function(data) {
				 
				var stockData = data.query.results.row;
							
				displayQuotes(stockData);
			}
		});
	}
	
	var setup = function() {
	
		// Only allow to setup once
		if(state.isSetup) {
			console.log("Is already setup!");
			return;
		}
	
		var $ticker = $('<div id="stockticker" class="hticker"><ul></ul></div>');
	
		$("body").append($ticker);
		
		stockticker = $('#stockticker').ticker({pxpersec:options.time.scrollSpeed});
		
		setInterval(loadQuotes, options.time.loadQuotes);
		loadQuotes();
		
		state.isSetup = true;
	}
	
	var setupOptions = function(opts) {
		$.extend(true, options, opts);
	}
	
	return {
		// Public functions
	
		constructor: StockTicker,
		setup: function(opts) {
			
			if(typeof opts != "undefined") {
				setupOptions(opts);
			}
			
			setup();
		}
	}
})();

$(document).ready(function() {
	stockTickerWidget = new StockTicker();
	
	var stocks = [
		"AAPL",
		"NFLX",
		"GRPN",
		"RIMM",
		"GOOG",
		"FB",
		"ZNGA",
		"TSLA",
		"T",
		"TU",
		"CSCO",
		"AMZN",
		"YHOO"
	];
	
	stockTickerWidget.setup({symbols: stocks});
});