window.addEventListener('message',function(e) {
	if (!e.data) return;
	if (e.data.source == 'bot_livecoding_agent') botForward(e.data);
},false);

function botForward(dataRequest) {
	dataRequest.source = 'bot_livecoding';
	chrome.extension.sendRequest(dataRequest,function(dataExecute) {
		if (!dataExecute) return;
		dataExecute.source = 'bot_livecoding';
		window.postMessage(dataExecute,'https://www.livecoding.tv/fiote/');
	});
}

var s = document.createElement('script');
s.src = chrome.extension.getURL('bot_livecoding_agent.js');
s.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(s);

