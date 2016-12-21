console.log('dbUsers loading...');
dbUsers = {};
chrome.storage.sync.get('dbUsers',function(value) {
	console.log(value);
	dbUsers = value;
	console.log('dbUsers loaded!');
});

classBot = function() {	
	var self = this;
	
	this.lastdate = new Date().getTime();

	this.points = {
		'register':100
	};

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
		var username = obj.username;

		// user commands
		if (cmd == '#entrar') this.addUser(username,'BR');
		if (cmd == '#enter') this.addUser(username,'EN');

		if (cmd == '#help') this.showHelp(username);

		// player commands
		if (cmd == '#music') this.replyMusic();
		if (cmd == '#request') this.requestMusic(parts,username);
		if (cmd == '#playlist') this.replyPlaylist();
		if (cmd == '#skip') this.addSkipMusic();

		// admin commands
		if (username == 'fiote') {
			if (cmd == '#clearqueue') this.clearQueue();
			if (cmd == '#powerskip') myPlayer.skipMusic();
			if (cmd == '#goradio') myPlayer.goRadio();
		}
	};

	this.addUser = function(username,lg) {		
		if (!dbUsers[username]) {
			dbUsers[username] = {'username':username,'points':this.points.register};
			var messages = {
				'BR':'@'+username+', obrigado por entrar! Voce tem '+this.points.register+' pontos! Digite #help para saber mais.',
				'EN':'@'+username+', thanks for joining! You have '+this.points.register+' points! Type #help to know more.'
			}
			this.sendMessage({'event':'msgChat','message':messages[lg]});
		}
		var user = dbUsers[username];
		user.language = lg;
		this.saveUsers();
	};

	this.showHelp = function(username) {
		var user = dbUsers[username] || {'username':username};
		var lg = user.language || 'EN';
		var messages = {
			'BR':'@'+username+', digite #music para ver a musica que esta tocando, #request para pedir uma musica (-25p) e #skip para tentar pular a musica atual (-3p).',
			'EN':'@'+username+', type #music to show the current song playing, #request to request any song you want  (-25p) and #skip to try to skip the song playing (-3p).'
		}
		this.sendMessage({'event':'msgChat','message':messages[lg]});
	};

	this.saveUsers = function() {
		console.log('dbUsers saving...');
		chrome.storage.sync.set({'dbUsers':dbUsers}, function() {
			console.log('dbUsers saved!');
        });
	};

	this.gotLogin = function(obj) {
		this.sendMessage({'event':'msgChat','message':obj.username+', bem-vindo & welcome! | Português? digite #entrar | English? Type #enter'});
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