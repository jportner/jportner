// constants
var VERSION; // version of the script (will abandon cookies from older versions)
var IMAGE_DIR; // directory where images are stored
var COOKIE_NAME; // name of cookie to load

// persistent variables
var currentTurn = -1; // current turn number (default: no turns have been played)
var highestTurn = -1; // highest turn seen by the players
var hist = [];
var resolution;
var audioEnabled = true;

// calculated variables
var colorDice = [];
var whiteDice = [];
var whiteStats = [0, 0, 0, 0];
var colorStats = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var barbarians = 0; // 0 to 7
var firstBarbariansTurn = -1;
deckObj = {}; // temporary json object that is loaded from cookie, maps where cards should be
var hidden = $('body').append('<div id="img-cache" style="display:none/>').children('#img-cache'); // hidden element to cache images
var controlsEnabled = true;

// this function is called when the page is loaded
$(document).ready(function() {  

	// define button click functions
	$("#anchor-white-die").click(function (e) {
		e.preventDefault();
		clickNextTurn();
	});
	$("#anchor-red-die").click(function (e) {
		e.preventDefault();
		clickNextTurn();
	});
	$("#anchor-yellow-die").click(function (e) {
		e.preventDefault();
		clickNextTurn();
	});

	// deal with fullscreen button
	if (!fullScreenApi.supportsFullScreen) {
		$("#buttonFullScreen").hide();
	}
	else
		updateFullScreenButton();
	
	// generate arrays for dice
	for( var i = 1; i <= 6; i++ ) {
		for( var j = 1; j <= 6; j++ ) {
			colorDice.push( [i, j] );
		}
	}
	for( var i = 0; i < 6; i++ )
		whiteDice.push( 0 );
	for( var i = 0; i < 6; i++ )
		whiteDice.push( 1 );
	for( var i = 0; i < 6; i++ )
		whiteDice.push( 2 );
	for( var i = 0; i < 18; i++ )
		whiteDice.push( 3 );

	var cookie = loadCookie(); // detects whether cookie was loaded

	// deal with audio button
	updateAudioButton();

	if( cookie ) {
		for( var i = 0; i <= currentTurn; i++ ) {
			increaseStats(i);
			increaseBarbarians(i);
		}
	}
	else {
		var width = $(window).width();
		if( width <= 1024 )
			resolution = "xga";
		else if( width <= 1280 )
			resolution = "hd";
		else if( width <= 1920 )
			resolution = "fhd";
		else if( width <= 2560 )
			resolution = "qhd";
		else
			resolution = "uhd";
	}

	// set the drop-down box to match the current resolution
	$("#resolution").val(resolution);
		
	IMAGE_DIR = "../images/" + resolution + "/";
	// change barbarians background images based on resolution
	$('td.barbarians').each(function(){
		$(this).css("background-image", "url('" + IMAGE_DIR + "barbarians-black.png" + "')");
	});
	for( var i = 0; i <= 7; i++ )
		$("#barbarians-" + i).attr('src', IMAGE_DIR + "barbarians-red.png");
	$("#white-die-blank").attr('src', IMAGE_DIR + "white-die-blank.png");
	$("#red-die-blank").attr('src', IMAGE_DIR + "red-die-blank.png");
	$("#yellow-die-blank").attr('src', IMAGE_DIR + "yellow-die-blank.png");

	// cache images to prevent turn lag
	//$('<img />').attr('src', IMAGE_DIR + "white-die-blank.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "white-die-blue-castle.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "white-die-green-castle.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "white-die-yellow-castle.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "white-die-barbarians.png").appendTo( hidden );
	//$('<img />').attr('src', IMAGE_DIR + "red-die-blank.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "red-die-1.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "red-die-2.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "red-die-3.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "red-die-4.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "red-die-5.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "red-die-6.png").appendTo( hidden );
	//$('<img />').attr('src', IMAGE_DIR + "yellow-die-blank.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "yellow-die-1.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "yellow-die-2.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "yellow-die-3.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "yellow-die-4.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "yellow-die-5.png").appendTo( hidden );
	$('<img />').attr('src', IMAGE_DIR + "yellow-die-6.png").appendTo( hidden );

	setTimeout(function(){updateState();}, 250); // allow DOM objects to load before updating
});

function increaseStats(i) {
	whiteStats[hist[i][0]]++;
	colorStats[hist[i][1] + hist[i][2] - 2]++;
}

function decreaseStats(i) {
	whiteStats[hist[i][0]]--;
	colorStats[hist[i][1] + hist[i][2] - 2]--;
}

function increaseBarbarians(i) {
	// if the barbarians attacked last turn, reset them
	if( barbarians == 7 ) {
		barbarians = 0;
		if( firstBarbariansTurn == -1 )
			firstBarbariansTurn = i;
	}

	// if the die is a barbarian ship
	if( hist[i][0] == 3 )
		barbarians++;
}

function decreaseBarbarians(i) {
	// if the die is a barbarian ship
	if( hist[i][0] == 3 )
		barbarians--;
	if( barbarians == 0 && i > 0 && hist[i-1][0] == 3 )
		barbarians = 7;
}

// function that is called when the user clicks the card, or the Next Card button
function clickNextTurn() {
	if( !controlsEnabled )
		return;

	if( currentTurn >= hist.length - 1 ) {
		$.shuffle(colorDice);
		$.shuffle(whiteDice);

		for( var i = 0; i < 31; i++ )
			hist.push( [whiteDice[i], colorDice[i][0], colorDice[i][1]] );
	}
	
	currentTurn++; // move to the next card
	if( currentTurn > highestTurn )
		highestTurn = currentTurn;
	increaseStats(currentTurn);
	increaseBarbarians(currentTurn);
	updateState(); // update the board
}

// function that is called when the user clicks the Prior Turn button
function clickPriorTurn() {
	if( !controlsEnabled )
		return;

	if( currentTurn == -1 ) // sanity, this shouldn't happen
		alert("There are no prior turns!");
	else // let's move to the previous turn
	{
		decreaseStats(currentTurn);
		decreaseBarbarians(currentTurn);
		currentTurn--; // move to the next turn
		updateState(); // update the board
	}
}

// function that is called when the user clicks the New Game button
function clickNewGame() {
	if( !controlsEnabled )
		return;

	var proceed = confirm("Are you sure you want to start over?");
	
	if( proceed )
		newGame();
}

function clickAudio() {
	audioEnabled = !audioEnabled;
	updateAudioButton();
}

function clickFullScreen() {
	if ( fullScreenApi.supportsFullScreen ) {
		var body = document.getElementById("body");
		if( fullScreenApi.isFullScreen() )
			fullScreenApi.cancelFullScreen(body);
		else
			fullScreenApi.requestFullScreen(body);
		updateFullScreenButton();
	}
}

function updateAudioButton() {
	$("#buttonAudio").fadeOut(250);
	setTimeout(function(){
		// change image to correct one
		if( audioEnabled ) {
			$("#imageAudio").attr("src", "../images/button-audio-on.png");
		}
		else {
			$("#imageAudio").attr("src", "../images/button-audio-off.png");
		}

		// change height and width
		$("#imageAudio").height( $("#header").height() );
		$("#imageAudio").width( $("#header").height() );
		$("#imageAudio").css( {'right':$("#header").height() + 2} );
		$("#buttonAudio").fadeIn(250);
	}, 500);
}

function updateFullScreenButton() {
	$("#buttonFullScreen").fadeOut(250);
	setTimeout(function(){
		// change image to correct one
		if( fullScreenApi.isFullScreen() ) {
			$("#imageFullScreen").attr("src", "../images/button-exit-full-screen.png");
		}
		else {
			$("#imageFullScreen").attr("src", "../images/button-enter-full-screen.png");
		}

		// change height and width
		$("#imageFullScreen").height( $("#header").height() );
		$("#imageFullScreen").width( $("#header").height() );
		$("#buttonFullScreen").fadeIn(250);
	}, 500);
}

function clickResolution() {
	var selected = $("#resolution").find(":selected").attr("value");
	if( resolution != selected ) {
		resolution = selected;
		saveCookie();
		location.reload(true); // reload the page
	}
}

// function that updates the board based on the current currentTurn
function updateState() {
	saveCookie(); // save the board

	// disable controls
	controlsEnabled = false;
	
	fadeImagesOut(); // automatically calls fadeImagesIn() after completion

	if( currentTurn == -1 )  // the currentTurn is less than or equal to -1,
		$("#buttonPriorTurn").attr("disabled", "disabled");
}

function finishUpdateState() {
	// enable controls
	controlsEnabled = true;
	
	if( currentTurn > -1 )  // if the currentTurn is greater than -1,
		$("#buttonPriorTurn").removeAttr("disabled");
		
	// update stat counters
	for( var i = 0; i < 4; i++ )
		$("#stats-white-" + i).text( whiteStats[i] );
	for( var i = 2; i <= 12; i++ )
		$("#stats-color-" + i).text( colorStats[i-2] );
	
	// set current card and total cards
	if( currentTurn == highestTurn )
		$("#currentTurn").text( currentTurn + 1 );
	else
		$("#currentTurn").text( (currentTurn + 1) + "/" + (highestTurn + 1) );
}

function fadeImagesOut() {
	// update dice
	$("#white-die").fadeOut(500); 
	$("#red-die").fadeOut(500); 
	$("#yellow-die").fadeOut(500);

	// update barbarians
	for( var i = 0; i <= 7; i++ )
		if( i != barbarians )
			if( $("#barbarians-" + i).is(":visible") )
				$("#barbarians-" + i).fadeOut(500);

	// update total
	$("#total").fadeOut(500);

	// update message
	var newMessage = "";
	if( currentTurn > -1 ) {
		if( barbarians == 7 )
			newMessage += "Barbarians attack!";
		if( hist[currentTurn][1] + hist[currentTurn][2] == 7 ) {
			if( newMessage.length > 0 )
				newMessage += " Then, discard";
			else
				newMessage += "Discard";
			newMessage += " resources";
			if( currentTurn >= firstBarbariansTurn && firstBarbariansTurn > -1 )
				newMessage += " and the robber strikes!";
			else
				newMessage += "!";
		}
	}
	else
		newMessage="Click one of the dice to roll them.";
	$("#message").fadeOut(500);

	if( currentTurn > -1 )
		setTimeout(function(){
			$("#message").text(newMessage);
			fadeImagesIn();
			}, 500);
	else {
		setTimeout(function(){$("#barbarians-" + barbarians).fadeIn(500);}, 500);
		setTimeout(function(){
			$("#message").text(newMessage);
			$("#message").fadeIn(500);
			}, 500);
		setTimeout(function(){
			$("#total").text("");
			$("#total").fadeIn(500);
			}, 500);
		finishUpdateState();
	}
}

function fadeImagesIn() {
	// update dice
	$("#white-die").attr("src", getWhiteDie(hist[currentTurn][0])); 
	$("#red-die").attr("src", getRedDie(hist[currentTurn][1])); 
	$("#yellow-die").attr("src", getYellowDie(hist[currentTurn][2])); 
	$("#white-die").fadeIn(500); 
	$("#red-die").fadeIn(500); 
	$("#yellow-die").fadeIn(500);

	// update barbarians
	if( ! $("#barbarians-" + barbarians).is(":visible") )
		$("#barbarians-" + barbarians).fadeIn(500);

	// update message
	$("#message").fadeIn(500);

	// update total
	var total = "";
	if( currentTurn > -1 )
		total = (hist[currentTurn][1] + hist[currentTurn][2]);
	$("#total").text(total);
	$("#total").fadeIn(500);

	setTimeout(function(){finishUpdateState() ;}, 500);

	if( barbarians == 7 && currentTurn == highestTurn )
		playSound('../sounds/horn.mp3');
	else if( hist[currentTurn][0] >= 0 && hist[currentTurn][0] <= 2 )
		playSound('../sounds/coins.mp3');
	else
		playSound('../sounds/cloth.mp3');
}

function html5_audio(){
	var a = document.createElement('audio');
	return !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
}
 
var play_html5_audio = false;
if(html5_audio()) play_html5_audio = true;
function playSound(url) {
	if (audioEnabled) {
		if(play_html5_audio){
			var snd = new Audio(url);
			snd.load();
			snd.play();
		}
		else{
			$.playSound(url);
		}
	}
}

// this function discards the cookie and then resets the game (used for debugging)
function newGame() {
	deleteCookie(); // delete the cookie that stores all the game data
    location.reload(true); // reload the page
}

// https://github.com/carhartl/jquery-cookie
// function to set the cookie
function saveCookie() {
	// create json data to serialize in the cookie
	var json = { "version" : VERSION, "currentTurn" : currentTurn, "highestTurn" : highestTurn, "resolution" : resolution, "audioEnabled" : audioEnabled, "hist" : hist };
	
	// store the cookie
	$.cookie(COOKIE_NAME, JSON.stringify(json), {expires:1});
}

// function to load the cookie
// returns true for success
// returns false for failure
function loadCookie() {
	var json = $.cookie(COOKIE_NAME);
	if( json == undefined )
		return false;

	var parsed = $.parseJSON(json);
	version = parsed.version;
	if( version < VERSION ) { // the cookie is from an old version
		alert("Your saved data is from an old version; data will be discarded and reloaded.");
		return false;
	}
	
	currentTurn = parsed.currentTurn;
	highestTurn = parsed.highestTurn;
	resolution = parsed.resolution;
	audioEnabled = parsed.audioEnabled;
	hist = parsed.hist;

	return true;
}

// function to delete the cookie
function deleteCookie() {
	$.removeCookie(COOKIE_NAME);
}

// http://www.yelotofu.com/2008/08/jquery-shuffle-plugin/
// jquery function to shuffle an array
(function($){
  $.fn.shuffle = function() {
    return this.each(function(){
      var items = $(this).children();
      return (items.length)
        ? $(this).html($.shuffle(items))
        : this;
    });
  }
 
  $.shuffle = function(arr) {
    for(
      var j, x, i = arr.length; i;
      j = parseInt(Math.random() * i),
      x = arr[--i], arr[i] = arr[j], arr[j] = x
    );
    return arr;
  }
})(jQuery);

function getWhiteDie( num ) {
	var img;
	if( num == 0 )
		img = "blue-castle";
	else if( num == 1 )
		img = "green-castle";
	else if( num == 2 )
		img = "yellow-castle";
	else if( num == 3 )
		img = "barbarians";
	return IMAGE_DIR + "white-die-" + img + ".png";
}
function getRedDie( num ) {
	return IMAGE_DIR + "red-die-" + num + ".png";
}
function getYellowDie( num ) {
	return IMAGE_DIR + "yellow-die-" + num + ".png";
}

// fullscreen support
(function() {
    var
        fullScreenApi = {
            supportsFullScreen: false,
            isFullScreen: function() { return false; },
            requestFullScreen: function() {},
            cancelFullScreen: function() {},
            fullScreenEventName: '',
            prefix: ''
        },
        browserPrefixes = 'webkit moz o ms khtml'.split(' ');
 
    // check for native support
    if (typeof document.cancelFullScreen != 'undefined') {
        fullScreenApi.supportsFullScreen = true;
    } else {
        // check for fullscreen support by vendor prefix
        for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
            fullScreenApi.prefix = browserPrefixes[i];
 
            if (typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
                fullScreenApi.supportsFullScreen = true;
 
                break;
            }
        }
    }
 
    // update methods to do something useful
    if (fullScreenApi.supportsFullScreen) {
        fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';
 
        fullScreenApi.isFullScreen = function() {
            switch (this.prefix) {
                case '':
                    return document.fullScreen;
                case 'webkit':
                    return document.webkitIsFullScreen;
                default:
                    return document[this.prefix + 'FullScreen'];
            }
        }
        fullScreenApi.requestFullScreen = function(el) {
            return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
        }
        fullScreenApi.cancelFullScreen = function(el) {
            return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
        }
    }
 
    // jQuery plugin
    if (typeof jQuery != 'undefined') {
        jQuery.fn.requestFullScreen = function() {
 
            return this.each(function() {
                if (fullScreenApi.supportsFullScreen) {
                    fullScreenApi.requestFullScreen(this);
                }
            });
        };
    }
 
    // export api
    window.fullScreenApi = fullScreenApi;
})();