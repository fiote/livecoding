window.addEventListener('message',function(e) {
	if (!e.data) return;
	if (e.data.source == 'bot_livecoding') botExecute(e.data);
},false);

function botExecute(feed) {
	if (feed.action == 'send_message') {
		var parts = [];
		if (feed.username) parts.push('@'+feed.username);
		if (feed.message) parts.push(feed.message);
		var txt = parts.join(' ').trim();

		if (txt) {
			var roomJid = Candy.View.getCurrent().roomJid;
			var roomType = Candy.View.Pane.Chat.rooms[roomJid].type;
			Candy.Core.Action.Jabber.Room.Message(roomJid,'[BOT] '+txt,roomType);
		}
	}
}

$(window).ready(function() {
	var _show = Candy.View.Pane.Message.show;
	Candy.View.Pane.Message.show = function(roomJid, name, message, xhtmlMessage, timestamp) {
		_show.apply(Candy.View.Pane.Message,arguments);
		var dataRequest = {
			'source':'bot_livecoding_agent',
			'event':'new_message',
			'obj': {
				'roomID':roomJid,
				'timestamp':timestamp,
				'username':name,
				'message':message
			}
		};
		window.postMessage(dataRequest,'https://www.livecoding.tv/fiote/');
	};		
});