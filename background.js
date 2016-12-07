localStorage.biggestDonate = null;
localStorage.lastDonate = null;

if (!localStorage.lastDonate) localStorage.lastDonate = null;
if (!localStorage.biggestDonate) localStorage.biggestDonate = null;
if (!localStorage.positions) localStorage.positions = '';
if (!localStorage.task) localStorage.task = '';

vPositions = (localStorage.positions) ? JSON.parse(localStorage.positions) : {};
console.log('vPositions',vPositions);

chrome.extension.onRequest.addListener(function(request, sender, callback) {
	console.log(request);
	if (request.event == 'transactions') updateTransactions(request.list,callback);
	if (request.event == 'music') updateMusic({'title':request.title,'artist':request.artist,'cover':request.cover},callback);

	if (request.event == 'update_pos') updatePos(request.obj,request.top,request.left);
	if (request.event == 'update_task') updateTask(request.task);

	if (request.event == 'open_admin') openAdmin(callback);
	if (request.event == 'get_storage') callback(localStorage);
});

adminTab = null;
function openAdmin(callback) {
	chrome.tabs.query({}, function(feed) {			
		adminTab = null;
		$.each(feed,function(i,tab) { 
			if (tab.url.indexOf('chrome-extension://'+chrome.runtime.id) >= 0) {
				console.log('GOT IT');
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
	localStorage.nowPlaying = JSON.stringify(newValue);
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

console.log(localStorage);