// ==================== MESSAGES FROM BACKGROUND =======================

chrome.runtime.onMessage.addListener(function(request) {
	console.log('listeresdad',request);
	if (request.event == 'msgChat') msgChat(request); 
});

// ==================== ACTING ON REQUEST =======================


function msgChat(request) {
	var dataExecute = {'source':'script_livecoding','action':'send_message','message':request.message};
	window.postMessage(dataExecute,location.origin);
}

// ==================== INJECTING AGENT =======================

var s = document.createElement('script');
s.src = chrome.extension.getURL('script_livecoding_agent.js');
s.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(s);

// ==================== MESSAGES FROM AGENT =======================

function botForward(dataRequest) {
	dataRequest.source = 'bot_livecoding';
	chrome.extension.sendRequest(dataRequest,function(dataExecute) {
		if (!dataExecute) return;
		dataExecute.source = 'bot_livecoding';
		window.postMessage(dataExecute,location.origin);
	});
}

window.addEventListener('message',function(e) {
	if (!e.data) return;
	if (e.data.source == 'bot_livecoding_agent') botForward(e.data);
},false);

