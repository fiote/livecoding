// ==================== MESSAGES FROM SCRIPT =======================

window.addEventListener('message',function(e) {
	console.log('AGENT',e);
	if (!e.data) return;
	if (e.data.source == 'script_deezer') botExecute(e.data);
},false);

// ==================== ACTING ON REQUEST =======================

function botExecute(feed) {
	console.log('botExecute',feed);
	
	if (feed.action == 'go_song_page') {
		reactRouter.push(feed.url);		
	}
	if (feed.action == 'hit_play') {
		setTimeout(hitPlay,1000);
	}
}

function hitPlay() {
	var $play = $('.page-main .play-icon.play-default');
	if ($play.length) $play.eq(0).click();
	else setTimeout(hitPlay,500);

}