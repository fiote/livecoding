classBot = function() {	
	var self = this;
	this.lastdate = new Date().getTime();

	this.setTab = function(tab) {
		this.tab = tab;
	};
	this.gotMessage = function(obj) {		
		if (!obj.timestamp) obj.timestamp = new Date().getTime();
		var dtLast = parseInt(this.lastdate);
		var dtObj = parseInt(obj.timestamp);
		if (dtObj < dtLast) return;

		var parts = obj.message.split(' ');
		var cmd = parts.shift();
		var user = obj.username;

		console.log('gotMessage',obj);

		// user commands
		if (cmd == '#music') this.replyMusic();
		if (cmd == '#request') this.requestMusic(parts,user);
		if (cmd == '#playlist') this.replyPlaylist();
		if (cmd == '#skip') this.addSkipMusic();

		if (cmd == '#help') this.showHelp();

		// admin commands
		if (user == 'fiote') {
			if (cmd == '#clearqueue') this.clearQueue();
			if (cmd == '#powerskip') myPlayer.skipMusic();
			if (cmd == '#goradio') myPlayer.goRadio();
		}
	};

	this.showHelp = function() {
		this.sendMessage({'event':'msgChat','message':'Type #music to show the current song playing, #request to request any song you want and #skip to try to skip the song playing.'});
	};

	this.gotLogin = function(obj) {
		this.sendMessage({'event':'msgChat','message':obj.username+', welcome! Type #help to see the list of commands.'});
	};

	this.replyMusic = function() {
		var playing = myPlayer.getMusic();
		var msg = (playing) ? playing.data.title+', by '+playing.data.artist+'.' : 'No song currently playing.';
		this.sendMessage({'event':'msgChat','message':msg});
	};

	this.addSkipMusic = function() {
		myPlayer.addSkipMusic();
	};

	this.clearQueue = function() {
		myPlayer.queue = [];
		this.sendMessage({'event':'msgChat','message':'The music queue is now empty.'});
	};

	this.replyPlaylist = function() {
		var playlist = myPlayer.getQueue();
		if (playlist.length == 0) {
			this.sendMessage({'event':'msgChat','message':'No musics on the queue.'});
		} else {
			var max = playlist.length;
			if (max > 3) max = 3;
			this.sendMessage({'event':'msgChat','message':'Next '+max+' musics queued:'});
			for (var i = 0; i < max; i++) {
				var n = i+1;
				var row = playlist[i];
				this.sendMessage({'event':'msgChat','message':row});
			}
		}
	};

	this.requestMusic = function(parts,user,callback) {
		var query = parts.join(' ');
		myPlayer.requestMusic(query,user,callback);
	};

	this.sendMessage = function(data) {
		if (!this.tab) {
			Util.getTab('https://www.livecoding.tv/fiote/',function(tab) {
				self.setTab(tab);
				self.sendMessage(data);
			});
			return;
		}
		console.log('SEND MESSAGE',this.tab,data);
		chrome.tabs.sendMessage(this.tab.id,data);
	};
};

myBot = new classBot();


chrome.extension.onRequest.addListener(function(request, sender, callback) {
	if (request.source == 'bot_livecoding') {
		myBot.setTab(sender.tab);
		if (request.event == 'new_message') myBot.gotMessage(request.obj);
		if (request.event == 'new_login') myBot.gotLogin(request.obj);
	}
});