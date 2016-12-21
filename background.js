classUtil = function() {	
	this.getTab = function(url,callback) {
		chrome.tabs.query({},function(tabs) {
			for (var i = 0; i < tabs.length; i++) {
				var tab = tabs[i];
				if (tab.url.indexOf(url) >= 0) callback(tab);
			} 
		});
	}
};

Util = new classUtil();



/*

localStorage.biggestDonate = null;
localStorage.lastDonate = null;

baseDeezer = '/mixes/genre/30931';
timeoutBackDeezer = null;

if (!localStorage.lastDonate) localStorage.lastDonate = null;
if (!localStorage.biggestDonate) localStorage.biggestDonate = null;
if (!localStorage.positions) localStorage.positions = '';
if (!localStorage.task) localStorage.task = '';
vPositions = (localStorage.positions) ? JSON.parse(localStorage.positions) : {};

adminTab = null;
musicTab = null;

var asktag = function(n,cb) {
	this.count = 0;
	this.needs = n;
	this.locked = false;

	this.add = function(i) {
		if (this.locked) return;

		if (!i) i = 1;
		this.count += i;
		if (this.count >= this.needs) cb();
		return this.count;
	};

	this.setLocked = function() {
		this.locked = true;
	};

	this.reset = function() {
		this.count = 0;
		this.locked = false;
	};
};

var asks = {};

asks['#skip'] = new asktag(3,function() {	
	console.log('#skip action triggered');
	if (!musicTab) return;
	chrome.tabs.sendMessage(musicTab.id,{'event':'skipSong'});
});

*/

chrome.extension.onRequest.addListener(function(request, sender, callback) {
	if (request.event == 'open_admin') openAdmin(callback);

	if (request.event == 'get_storage') callback(localStorage);
	
	if (request.event == 'music') {
		musicTab = sender.tab;
		updateMusic({'title':request.title,'artist':request.artist,'cover':request.cover},callback);
	}
	/*

	if (request.event == 'transactions') updateTransactions(request.list,callback);

	if (request.event == 'update_pos') updatePos(request.obj,request.top,request.left);
	if (request.event == 'update_task') updateTask(request.task);


	if (request.source == 'bot_livecoding') {
		if (request.event == 'new_message') checkMesage(request.obj,callback);
	}

	*/
});

/*

if (!localStorage.lastBotMsg) localStorage.lastBotMsg = null;

function checkMesage(obj,callback) {
	if (!obj.timestamp) obj.timestamp = new Date().getTime();

	if (localStorage.lastBotMsg) {	
		var last = JSON.parse(localStorage.lastBotMsg);
		if (last) {
			var dtLast = parseInt(last.timestamp);
			var dtMsg = parseInt(obj.timestamp);
			if (dtMsg < dtLast) return;
		}
	}

	localStorage.lastBotMsg = JSON.stringify(obj);
	
	var parts = obj.message.split(' ');
	var cmd = parts.shift();

	if (cmd == '#hi' || cmd == '#oi') callback({'action':'send_message','username':obj.username,'message':'Olá! / Hello!'});
	
	if (cmd == '#music') {
		var playing = JSON.parse(localStorage.nowPlaying);
		callback({'action':'send_message','message':'[titulo: '+playing.title+', banda: '+playing.artist+']'});
	}

	if (cmd == '#request') {
		var q = parts.join(' ');
		$.get('http://api.deezer.com/search/track/?q='+q+'&index=0&limit=5&order=RANKING&output=json',function(feed) { 
			console.log(feed); 
			var list = feed.data;
			if (list.length) {

				list.sort(function(a,b) { return (a.rank > b.rank) ? -1 : +1; });

				var row = list[0];
				callback({'action':'send_message','message':'[titulo: '+row.title+', banda: '+row.artist.name+']'});	
				if (musicTab) {
					clearTimeout(timeoutBackDeezer);
					chrome.tabs.sendMessage(musicTab.id,{'event':'playSong','url':'/track/'+row.id});						
					asks['#skip'].setLocked();

					timeoutBackDeezer = setTimeout(function() { 
						chrome.tabs.sendMessage(musicTab.id,{'event':'playSong','url':baseDeezer});
						asks['#skip'].reset();
					},(row.duration+2)*1000);
				}
			}
		});
	}

	if (cmd == '#radio') {
		console.log(asks['#skip']);
		if (!asks['#skip'].locked) return callback({'action':'send_message','message':cmd+' failed.'});;
		clearTimeout(timeoutBackDeezer);
		chrome.tabs.sendMessage(musicTab.id,{'event':'playSong','url':baseDeezer});
		asks['#skip'].reset();
		callback({'action':'send_message','message':'de volta a radio...'});
	}

	if (cmd == '#skip') {
		var ask = asks[cmd];
		var ok = ask.add();
		if (!ok) return callback({'action':'send_message','message':cmd+' failed.'});
		var c = ask.count, n = ask.needs;
		var progress = (c < n) ? '('+c+'/'+n+')' : 'Trocando...';
		callback({'action':'send_message','username':obj.username,'message':'pediu pra mudar de musica! '+progress});
	}
}
*/

function openAdmin(callback) {
	chrome.tabs.query({}, function(feed) {			
		adminTab = null;
		$.each(feed,function(i,tab) { 
			if (tab.url.indexOf('chrome-extension://'+chrome.runtime.id) >= 0) {
				adminTab = tab; 
			}
		});
		if (adminTab) {
			chrome.tabs.update(adminTab.id,{'active':true});
			callback(); 
		} else {
			var path = 'admin.html';
			var url = chrome.extension.getURL(path);
			chrome.tabs.create({'url':url},function(tab) { adminTab = tab; });
			callback();
		}
	});
}	
/*

function updatePos(obj,top,left) {
	if (top || left) {
		vPositions[obj] = {'top':top,'left':left};
	} else {
		delete vPositions[obj];
	}
	localStorage.positions = JSON.stringify(vPositions);
}

function updateTask(task) {
	localStorage.task = JSON.stringify({'value':task});
}

function updateMusic(newValue,callback) {
	var newPlaying = JSON.stringify(newValue);
	if (localStorage.nowPlaying != newPlaying) asks['#skip'].reset();

	localStorage.nowPlaying = newPlaying;
	tryToSendStorage();
	callback();
}

function updateTransactions(list,callback) {
	list.sort(function(a,b) { return (a.date > b.date) ? -1 : 1; });
	var last = {'name':list[0].username, 'value':list[0].number};

	var all = [];
	for (var i = 0; i < list.length; i++) all.push({'name':list[i].username, 'value':list[i].number});

	list.sort(function(a,b) { return (a.number > b.number) ? -1 : 1; });
	var biggest = {'name':list[0].username, 'value':list[0].number};

	localStorage.lastDonate = JSON.stringify(last);
	localStorage.biggestDonate = JSON.stringify(biggest);
	localStorage.allDonates = JSON.stringify(all);

	tryToSendStorage();
	callback();
}

function tryToSendStorage() {	
	if (adminTab) chrome.tabs.sendMessage(adminTab.id,{'event':'storage','storage':localStorage});
}

*/