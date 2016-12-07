chrome.runtime.onMessage.addListener(function(request) {
	if (request.event == 'skipSong') skipSong(); 
	if (request.event == 'playSong') playSong(request.url);
});

function skipSong() {
	$('.control.control-next').click();
}

function playSong(url) {
	var dataExecute = {'source':'scrap_deezer','action':'play_song','url':url};
	window.postMessage(dataExecute,'http://www.deezer.com');
}


setInterval(function() {
	var spans = $('.player-track-link').map(function() { return $(this).text(); });
	var dataRequest = {'event':'music', 'title':spans[0], 'artist':spans[1], 'cover':$('.player-cover img').attr('src')};
	chrome.extension.sendRequest(dataRequest);
},3000);


var s = document.createElement('script');
s.src = chrome.extension.getURL('scrap_deezer_agent.js');
s.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(s);

