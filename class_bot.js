console.log('dbUsers loading...');
dbUsers = {};

chrome.storage.sync.get(function(storage) {
	var dataUsers = storage.dbUsers || {};
	for (var username in dataUsers) {
		var data = dataUsers[username];
		var user = new classUser(data);
		dbUsers[username] = user;
	}
	console.log('dbUsers loaded!',dbUsers);
	myBot.saveUsers();
});

adminUsername = 'fiote';

classBot = function() {	
	var self = this;
	
	this.lastdate = new Date().getTime();
	
	var secondsTick = 60*5;	
	setInterval(function() { self.addGoldEveryone(); },secondsTick*1000);

	this.gold = {
		'register':30,
		'music':5,
		'skip':1,
		'level':10
	};

	this.bonus = {'exp':10,'gold':1};

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

		// player commands
		if (cmd == '#music') this.replyMusic();
		if (cmd == '#request') this.requestMusic(parts,username);
		if (cmd == '#playlist') this.replyPlaylist();
		if (cmd == '#skip') this.addSkipMusic(username);		
		if (cmd == '#me') this.replyMe(username);
		if (cmd == '#help') this.showHelp(username);

		// 
		if (cmd == '#rank') this.showRank();

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
			user.returned();
			this.showLgCount();
		} else {
			var temp = new classUser(username);
			temp.askToEnter();
		}
	};

	this.addUser = function(username,lg) {
		var user = dbUsers[username];
		if (user) {
			user.already();
		} else {
			user = new classUser({'username':username,'language':lg,'gold':0,'level':1,'exp':0});
			user.enter();
			dbUsers[username] = user;
			this.saveUsers();
			this.showLgCount();
		}
	};

	this.removeUser = function(parts) {
		var username = parts[0];
		var user = dbUsers[username];
		if (user) {
			delete dbUsers[username];
			user.removed();
			this.saveUsers();
			this.showLgCount();
		}

		if (dbUsers[username]) {
			delete dbUsers[username];
		}		
	};

	this.notUser = function(username) {
		var temp = new classUser(username);
		temp.askToEnter();
	};

	this.saveUsers = function() {
		var dataUsers = {};
		for (var username in dbUsers) dataUsers[username] = dbUsers[username].data;
		chrome.storage.sync.set({'dbUsers':dataUsers});
	};
	
	this.replyMe = function(username) {
		var user = dbUsers[username];
		if (!user) return this.notUser(username);
		user.status();
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
					var lg = (user) ? user.data.language : '??';
					if (!lgs[lg]) lgs[lg] = 0;
					lgs[lg]++;
				}
			}
			var blocks = [];
			var names = {'EN':'English speakers','BR':'Brasileiros','??':'??'};
			for (var lg in lgs) blocks.push(names[lg]+' ('+lgs[lg]+')');
			if (blocks.length > 0) this.sendMessage({'event':'msgChat','message':blocks.join(', ')+'.'});

			this.lgCount = false;
		}

		if (this.addNext) {
			var toadd = [];
			for (var i = 0; i < list.length; i++) {
				var username = list[i];
				if (username != adminUsername) {
					var user = dbUsers[username];
					if (user) toadd.push(user);
				}
			}		
			if (toadd.length) {
				var exp = this.bonus.exp;
				var gold = this.bonus.gold;
				this.sendMessage({'event':'msgChat','message':'Online Bonus! [+'+exp+'xp +'+gold+'g]'});		
				for (var i = 0; i < toadd.length; i++) {
					var user = toadd[i];
					user.addGold(gold);
					user.addExp(exp);
				}
			}
			this.addNext = false;
		}
	};

	this.showHelp = function(username) {
		var user = dbUsers[username];
		if (!user) return this.notUser(username);
		user.showHelp();
	};

	this.addGoldEveryone = function() {
		this.addNext = true;
		this.requestUserList();
	};

	this.showRank = function() {
		var list = [];
		for (var username in dbUsers) {
			var user = dbUsers[username];
			//if (username != adminUsername) 
				list.push(user);
		}
		list.sort(function(a,b) {
			if (a.data.level > b.data.level) return -1;
			if (a.data.level < b.data.level) return +1;
			if (a.data.exp > b.data.exp) return -1;
			if (a.data.exp < b.data.exp) return +1;
			return 0;
		});
		
		for (var i = 0; i < list.length && i < 5; i++) {
			var user = list[i];
			var n = i+1;
			user.msg(n+') @USER, Exp: @XP/@XPNEED');
		}
	};

	// ==============================================================
	//	MUSIC
	// ==============================================================

	this.replyMusic = function() {
		var playing = myPlayer.getMusic();
		var msg = (playing) ? playing.data.title+', by '+playing.data.artist+'.' : 'No song currently playing (or the deezer tab is not connected).';
		this.sendMessage({'event':'msgChat','message':msg});
	};

	this.addSkipMusic = function(username) {
		var user = dbUsers[username];
		if (!user) return this.notUser(username);

		var cost = this.gold.skip;
		if (user.gold < cost) return user.notgold(cost);

		user.addGold(cost*-1);
		myPlayer.addSkipMusic();
	};

	this.clearQueue = function() {
		myPlayer.queue = [];
		myPlayer.refreshQueue();
		this.sendMessage({'event':'msgChat','message':'The music queue is now empty.'});
	};

	this.replyPlaylist = function() {
		var playlist = myPlayer.getQueue();
		if (playlist.length == 0) {
			this.sendMessage({'event':'msgChat','message':'No musics on the queue.'});
		} else {
			var max = playlist.length;
			var maxmax = 5;
			if (max > maxmax) max = maxmax;
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
		var cost = this.gold.music;
		if (user.gold < cost) return user.notgold(cost);

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
		console.log('SEND MESSAGE',data);
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