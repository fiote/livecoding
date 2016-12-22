console.log('dbUsers loading...');
dbUsers = {};
chrome.storage.sync.get(function(storage) {
	dbUsers = storage.dbUsers;
	//dbUsers = value;
	console.log('dbUsers loaded!');
});

adminUsername = 'fiote';

classBot = function() {	
	var self = this;
	
	this.lastdate = new Date().getTime();
	
	setInterval(function() { self.addPointsEveryone(); },5*60*1000);

	this.points = {
		'register':30,
		'music':5,
		'skip':1
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

		if (cmd == '#me') this.replyMe(username);

		if (cmd == '#help') this.showHelp(username);

		// player commands
		if (cmd == '#music') this.replyMusic();
		if (cmd == '#request') this.requestMusic(parts,username);
		if (cmd == '#playlist') this.replyPlaylist();
		if (cmd == '#skip') this.addSkipMusic(username);

		// admin commands
		if (username == adminUsername) {
			if (cmd == '#clearqueue') this.clearQueue();
			if (cmd == '#powerskip') myPlayer.skipMusic();
			if (cmd == '#goradio') myPlayer.goRadio();
			if (cmd == '#delete') this.removeUser(parts);
		}
	};

	// ==============================================================
	//	USER
	// ==============================================================

	this.gotLogin = function(obj) {
		var username = obj.username;

		var user = dbUsers[username];
		if (user) {
			var messages = {
				'BR':'@'+username+', seja bem vindo de volta o/',
				'EN':'@'+username+', welcome back o/'
			}
			var lg = user.language;
			this.sendMessage({'event':'msgChat','message':messages[lg]});
			this.showLgCount();
		} else {
			this.sendMessage({'event':'msgChat','message':'@'+username+'! | PT/BR? digite #entrar | EN/US? type #enter'});
		}
	};

	this.addUser = function(username,lg) {
		if (dbUsers[username]) {
			var messages = {
				'BR':'@'+username+', voce ja esta registrado.',
				'EN':'@'+username+', you are registered already.'
			}
			this.sendMessage({'event':'msgChat','message':messages[lg]});
		} else {
			dbUsers[username] = {'username':username,'points':this.points.register};
			var messages = {
				'BR':'@'+username+', seja bem-vindo e obrigado por entrar! Voce tem '+this.points.register+' pontos! Digite #help para saber mais.',
				'EN':'@'+username+', welcome and thanks for joining! You have '+this.points.register+' points! Type #help to know more.'
			}
			this.sendMessage({'event':'msgChat','message':messages[lg]});
		}
		var user = dbUsers[username];
		user.language = lg;
		this.saveUsers();
		this.showLgCount();
	};

	this.removeUser = function(parts) {
		var username = parts[0];
		if (dbUsers[username]) {
			delete dbUsers[username];
			this.sendMessage({'event':'msgChat','message':'@'+username+' removed.'});
			this.saveUsers();
			this.showLgCount();
		}		
	};

	this.notUser = function(username) {
		this.sendMessage({'event':'msgChat','message':'@'+username+', Portugues? digite #entrar primeiro | English? Type #enter first.'});
	};

	this.notPoints = function(user,cost) {
		var abscost = Math.abs(cost);
		var messages = {
			'BR':'@'+username+', voce nao tem pontos suficientes ('+user.points+'/'+abscost+').',
			'EN':'@'+username+', you dont have enough points ('+user.points+'/'+abscost+').'
		};
		var lg = user.language;
		this.sendMessage({'event':'msgChat','message':messages[lg]});
	};

	this.saveUsers = function() {
		console.log('dbUsers saving...');
		chrome.storage.sync.set({'dbUsers':dbUsers}, function() {
			console.log('dbUsers saved!');
        });
	};
	
	this.replyMe = function(username) {
		var user = dbUsers[username];
		if (!user) return this.notUser(username);

		var pts = user.points;
		var messages = {
			'BR':'@'+username+', voce tem '+pts+' pontos.',
			'EN':'@'+username+', you have '+pts+' points.'
		}
		var lg = user.language;
		this.sendMessage({'event':'msgChat','message':messages[lg]});
	};

	this.showLgCount = function() {
		this.lgCount = true;
		this.requestUserList();
	};

	this.requestUserList = function() {
		this.sendMessage({'event':'getUserList'});
	};

	this.gotUserList = function(list) {
		if (this.lgCount) {
			var lgs = {};
			for (var i = 0; i < list.length; i++) {
				var username = list[i];
				if (username != adminUsername) {
					var user = dbUsers[username];
						var lg = (user) ? user.language : '??';
					if (!lgs[lg]) lgs[lg] = 0;
					lgs[lg]++;
				}
			}
			var blocks = [];
			var names = {'EN':'English speakers','BR':'Brasileiros','??':'??'};
			for (var lg in lgs) blocks.push(names[lg]+' ('+lgs[lg]+')');
			this.sendMessage({'event':'msgChat','message':blocks.join(', ')+'.'});

			this.lgCount = false;
		}

		if (this.addNext) {
			var any = false;
			for (var i = 0; i < list.length; i++) {
				var username = list[i];
				if (username != adminUsername) {
					var user = dbUsers[username];
					if (user) {
						user.points += 1;
						any = true;
					}
				}
			}		
			if (any) {
				this.sendMessage({'event':'msgChat','message':'+1p to everyone! +1 pra todo mundo!'});				
				this.saveUsers();
			}
			this.addNext = false;
		}
	};

	this.showHelp = function(username) {
		var user = dbUsers[username];
		if (!user) return this.notUser(username);

		var mu = this.points.music;
		var sk = this.points.skip;
		var lg = user.language;

		var messages = {
			'BR':'@'+username+', digite #music para ver a musica que esta tocando, #request para pedir uma musica (-'+mu+'p), #skip para tentar pular a musica atual (-'+sk+'p) e #me para ver seus dados.',
			'EN':'@'+username+', type #music to show the current song playing, #request to request any song you want  (-'+mu+'p), #skip to try to skip the song playing (-'+sk+'p) e #me to see your data.'
		}
		this.sendMessage({'event':'msgChat','message':messages[lg]});
	};

	this.addPointsEveryone = function() {
		this.addNext = true;
		this.requestUserList();
	};

	// ==============================================================
	//	MUSIC
	// ==============================================================

	this.replyMusic = function() {
		var playing = myPlayer.getMusic();
		var msg = (playing) ? playing.data.title+', by '+playing.data.artist+'.' : 'No song currently playing.';
		this.sendMessage({'event':'msgChat','message':msg});
	};

	this.addSkipMusic = function(username) {
		var user = dbUsers[username];
		if (!user) return this.notUser(username);
		if (user.points < this.points.skip) return this.notPoints(user,this.points.skip);

		user.points -= this.points.skip;
		this.saveUsers();

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

	this.requestMusic = function(parts,username,callback) {
		var user = dbUsers[username];
		if (!user) return this.notUser(username);
		if (user.points < this.points.music) return this.notPoints(user,this.points.music);

		var query = parts.join(' ');
		myPlayer.requestMusic(query,user,callback);
	};

	// ==============================================================
	//	MISC
	// ==============================================================

	this.sendMessage = function(data,callback) {
		if (!this.tab) {
			Util.getTab('https://www.livecoding.tv/fiote/',function(tab) {
				self.setTab(tab);
				self.sendMessage(data,callback);
			});
			return;
		}
		console.log('SEND MESSAGE',this.tab,data);
		chrome.tabs.sendMessage(this.tab.id,data,callback);
	};
};

myBot = new classBot();

chrome.extension.onRequest.addListener(function(request, sender, callback) {
	if (request.source == 'bot_livecoding') {
		myBot.setTab(sender.tab);
		if (request.event == 'new_message') myBot.gotMessage(request.obj);
		if (request.event == 'new_login') myBot.gotLogin(request.obj);
		if (request.event == 'user_list') myBot.gotUserList(request.list);
	}
});