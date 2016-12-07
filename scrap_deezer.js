setInterval(function() {
	var spans = $('.player-track-link').map(function() { return $(this).text(); });
	var dataRequest = {'event':'music', 'title':spans[0], 'artist':spans[1], 'cover':$('.player-cover img').attr('src')};
	console.log(dataRequest);
	chrome.extension.sendRequest(dataRequest);
},3000);