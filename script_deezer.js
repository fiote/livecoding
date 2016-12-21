// ==================== MESSAGES FROM BACKGROUND =======================

chrome.runtime.onMessage.addListener(function(request) {
	console.clear();
	console.log(request);
	if (request.event == 'skipSong') skipSong(); 
	if (request.event == 'playSong') playSong(request.url);
	if (request.event == 'setQueue') setQueue(request.list);
});

// ==================== INJECTING AGENT =======================

var s = document.createElement('script');
s.src = chrome.extension.getURL('script_deezer_agent.js');
s.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(s);

// ==================== ACTING ON REQUEST =======================

function skipSong() {
	if (queueList.length) return goNextQueue();
	$('.control.control-next').click();
}

function playSong(url) {
	tellAgent({'action':'go_song_page','url':url});	
	tellAgent({'action':'hit_play'});
}

function setQueue(list) {
	queueList = list;
	if (queueList.length) {
		var next = queueList[0];
		tellAgent({'action':'go_song_page','url':next.data.url});
	} else {
		tellAgent({'action':'go_song_page','url':'/mixes/genre/30931'});
	}
}

function tellAgent(dataExecute) {
	dataExecute.source = 'script_deezer';
	console.log('tellAgent',dataExecute);
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

queueList = [];
hittingPlay = false;
playingQueue = false;
currentData = {};

function goNextQueue() {
	hittingPlay = true;
	playingQueue = true;
	tellAgent({'action':'hit_play'});
	chrome.extension.sendRequest({'event':'shift_queue'});
}

function goBackRadio() {
	hittingPlay = true;
	playingQueue = false;
	tellAgent({'action':'hit_play'});
	chrome.extension.sendRequest({'event':'shift_queue'});
}

setInterval(function() {
	var spans = $('.player-track-link').map(function() { return $(this).text(); });
	var progress = getSecondsFrom($('.progress-time').text());
	var duration = getSecondsFrom($('.progress-length').text());
	var dataRequest = {'event':'update_music', 'data':{'title':spans[0], 'artist':spans[1], 'progress':progress,'duration':duration,'cover':$('.player-cover img').attr('src')}};

	if (spans[0] != currentData.title) hittingPlay = false;
	currentData = dataRequest.data;

	chrome.extension.sendRequest(dataRequest);

	var rest = duration - progress;
	
	console.log(progress,duration,rest);

	if (rest < 10) {
		console.log(queueList,playingQueue,hittingPlay);
		if (!hittingPlay) {
			if (queueList.length) return goNextQueue();
			if (playingQueue) return goBackRadio();
		}
	}

},1001);
