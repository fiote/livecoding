classPlayer = function() {
	var self = this;
	
	this.history = [];
	this.queue = [];

	this.skipCount = 0;
	this.skipNeed = 3;
	
	this.changingMusic = false;
	this.playingAny = false;
	
	this.onRadio = true;
	this.waitingRadio = false;

	this.setTab = function(tab) {
		this.tab = tab;
	};

	this.setMusic = function(data) {
		var music = new classMusic(data);	
		if (!music.data.progress) return;

		var last = this.history[0];		

		if (last && last.key == music.key) {
			last.updateProgress(data.progress);
			return;
		}

		this.refreshQueue();

		if (this.waitingRadio) {
			this.waitingRadio = false;
			this.onRadio = true;
		}

		if (this.changingMusic) {
			this.changingMusic = false;
		}

		this.playingAny = true;
		this.skipCount = 0;

		this.history.unshift(music);
	};

	this.getMusic = function() {
		return this.history[0];
	};

	this.requestMusic = function(query,user,callback) {
		$.get('http://api.deezer.com/search/track/?q='+query+'&index=0&limit=5&order=RANKING&output=json',function(feed) {			
			var list = feed.data;
			if (list.length) {
				var row = list[0];
				var music = new classMusic({'id':row.id,'artist':row.artist.name,'cover':row.album.cover_medium,'title':row.title_short,'duration':row.duration});
				music.requestedby = user.data.username;
				user.addGold(myBot.gold.music*-1);
				self.queueMusic(music);
			} else {
				myBot.sendMessage({'event':'msgChat','message':'No music found.'});
			}
		});
	};

	this.queueMusic = function(music) {
		var dsQueue = '';		
		if (!this.playingAny) {
			dsQueue = 'Playing NOW!';
		} else {
			var iNext = this.queue.length+1;
			dsQueue = 'Playing next (+'+iNext+')!';
		}
		myBot.sendMessage({'event':'msgChat','message':'@'+music.requestedby+' requested "'+music.data.title+'", by '+music.data.artist+'. '+dsQueue});
		this.queue.push(music);
		this.refreshQueue();
	};

	this.refreshQueue = function() {		
		this.sendMessage({'event':'setQueue','list':this.queue});
	};

	this.removeFromQueue = function(music) {
		var index = null;
		for (var i = 0; i < this.queue.length; i++) {
			var m = this.queue[i];
			if (m.data.url == music.data.url) index = i;
		}
		if (index >= 0) {
			this.queue.splice(index,1);
			this.sendMessage({'event':'setQueue','list':this.queue});
		}
	};

	this.goRadio = function() {
		this.waitingRadio = true;
		this.sendMessage({'event':'playSong','url':'/mixes/genre/30931'});
	};
	
	this.getQueue = function() {
		var list = [];
		for (var i = 0; i < this.queue.length; i++) {
			var music = this.queue[i];
			list.push(music.data.title+', by '+music.data.artist+' (requested by '+music.requestedby+')');
		}
		return list;
	};

	this.changeMusic = function(music) {
		this.changingMusic = true;
		this.onRadio = false;
		this.waitingRadio = false;
		this.sendMessage({'event':'playSong','url':music.data.url});
	};

	this.addSkipMusic = function() {
		var music = this.getMusic();
		if (music && music.requestedby) return myBot.sendMessage({'event':'msgChat','message':'It\'s not possible to skip a requested song.'});

		if (this.changingMusic) return myBot.sendMessage({'event':'msgChat','message':'Please wait until the music finish changing.'});

		this.skipCount++;	
		myBot.sendMessage({'event':'msgChat','message':'Skip '+this.skipCount+'/'+this.skipNeed+' received.'});

		if (this.skipCount >= this.skipNeed) {
			myBot.sendMessage({'event':'msgChat','message':'Skipping music...'});
			this.skipMusic();
		}
	};

	this.skipMusic = function() {
		this.changingMusic = true;
		this.sendMessage({'event':'skipSong'});
	};
	
	this.sendMessage = function(data) {
		if (!this.tab) {
			Util.getTab('www.deezer.com',function(tab) {
				self.setTab(tab);
				self.sendMessage(data);
			});
			return;
		}
		chrome.tabs.sendMessage(this.tab.id,data);
	};
};

classMusic = function(data) {
	this.key = JSON.stringify({'artist':data.artist,'title':data.title});
	this.data = data;

	this.data.url = '/track/'+this.data.id;

	this.updateProgress = function(progress) {
		this.data.progress = progress;
		return this.data.duration - this.data.progress;
	};
};

myPlayer = new classPlayer();

chrome.extension.onRequest.addListener(function(request, sender, callback) {	
	if (request.event == 'update_music') {
		myPlayer.setTab(sender.tab);
		myPlayer.setMusic(request.data);
	}
	if (request.event == 'shift_queue') {
		myPlayer.queue.shift();	
	}
});