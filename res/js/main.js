function notdefined(variable) {
	return (typeof variable == "undefined");
}

Array.prototype.remove = function(v) {
	this.splice(this.indexOf(v) == -1 ? this.length : this.indexOf(v), 1);
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