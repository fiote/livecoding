// ==================== MESSAGES FROM BACKGROUND =======================

chrome.runtime.onMessage.addListener(function(request) {
	if (request.event == 'skipSong') skipSong(); 
	if (request.event == 'playSong') playSong(request.url);
});

// ==================== INJECTING AGENT =======================

var s = document.createElement('script');
s.src = chrome.extension.getURL('script_deezer_agent.js');
s.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(s);

// ==================== ACTING ON REQUEST =======================

function skipSong() {
	$('.control.control-next').click();
}

function playSong(url) {
	var dataExecute = {'source':'scrap_deezer','action':'play_song','url':url};
	window.postMessage(dataExecute,location.origin);
}

// ==================== SCRAPPING PLAYING MUSIC =======================

function getSecondsFrom(text) {
	var parts = text.split(':');
	if (parts.length == 2) {
		var mins = parseInt(parts[0]);
		var secs = parseInt(parts[1]);
		return mins*60 + secs;
	}
}

setInterval(function() {
	var spans = $('.player-track-link').map(function() { return $(this).text(); });
	var progress = getSecondsFrom($('.progress-time').text());
	var duration = getSecondsFrom($('.progress-length').text());
	var dataRequest = {'event':'update_music', 'data':{'title':spans[0], 'artist':spans[1], 'progress':progress,'duration':duration,'cover':$('.player-cover img').attr('src')}};
	chrome.extension.sendRequest(dataRequest);
},500);
