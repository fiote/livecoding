classUser = function(data) {	
	if (typeof data == 'string') data = {'username':data};
	this.data = data;

	this.askToEnter = function() {
		this.msg('@USER! | PT/BR? digite #entrar | EN/US? type #enter');
	};

	this.enter = function() {
		var gold = myBot.gold.register;
		this.msg(
			'@USER, seja bem-vindo e obrigado por entrar! Voce ganhou '+gold+' moedas! Digite #help para saber mais.',
			'@USER, welcome and thanks for joining! You earned '+gold+' gold! Type #help to know more.'
		);
		this.addGold(gold);
	};

	this.addGold = function(gold) {
		this.data.gold += gold;
		myBot.saveUsers();
	};

	this.getExpNeed = function() {
		return this.data.level*100;
	};

	this.addExp = function(xp) {
		this.data.exp += xp;
		if (this.data.exp >= this.getExpNeed()) this.levelUp();
		myBot.saveUsers();
	};

	this.levelUp = function() {
		this.data.level += 1;
		this.data.exp = 0;
		var gold = myBot.gold.level;

		this.msg(
			'@USER: Level up! +'+gold+' moedas pra voce o/',
			'@USER: Level up! +'+gold+' gold for you o/'
		);
	};

	this.already = function() {
		this.msg(
			'@USER, voce ja esta registrado.',
			'@USER, you are registered already.'
		);
	};

	this.returned = function() {
		this.msg(
			'@USER, seja bem vindo de volta o/',
			'@USER, welcome back o/'
		);
	};

	this.notgold = function(cost) {
		var abscost = Math.abs(cost);
		var gold = this.data.gold;
		this.msg = (
			'@USER, voce nao tem moedas suficientes ('+gold+'/'+abscost+').',
			'@USER, you dont have enough gold ('+gold+'/'+abscost+').'
		);
	};

	this.status = function() {
		var gold = this.data.gold;
		var lvl = this.data.level;
		var exp = this.data.exp;
		var need = this.getExpNeed();
		this.msg(
			'@USER: Exp: '+exp+'/'+need+', '+gold+' moedas.',
			'@USER: Exp: '+exp+'/'+need+', '+gold+' gold.'
		);
	};

	this.showHelp = function() {
		var mu = myBot.gold.music;
		var sk = myBot.gold.skip;

		this.msg(
			'@USER, digite #music para ver a musica que esta tocando, #request para pedir uma musica (-'+mu+'g), #skip para tentar pular a musica atual (-'+sk+'g) e #me para ver seus dados.',
			'@USER, type #music to show the current song playing, #request to request any song you want  (-'+mu+'g), #skip to try to skip the song playing (-'+sk+'g) and #me to see your data.'
		);
	}

	this.removed = function() {
		this.msg(
			'@USER foi removido.',
			'@USER was removed'
		);
	};

	this.msg = function(br,en) {
		var versions = {};
		versions['BR'] = br;
		versions['EN'] = en || br;

		var lg = this.data.language || 'EN';

		var vUser = '@'+this.data.username;
		if (this.data.level) vUser += ' (Lv.'+this.data.level+')';

		var message = versions[lg];
		message = message.replace('@USER',vUser);
		message = message.replace('@XPNEED',this.getExpNeed());
		message = message.replace('@GOLD',this.data.gold);
		message = message.replace('@XP',this.data.exp);
		

		myBot.sendMessage({'event':'msgChat','message':message});
	};
};