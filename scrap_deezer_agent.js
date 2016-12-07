window.addEventListener('message',function(e) {
	if (!e.data) return;
	if (e.data.source == 'scrap_deezer') botExecute(e.data);
},false);

function botExecute(feed) {
	if (feed.action == 'play_song') {
		reactRouter.push(feed.url);
		setTimeout(waitToPlay,3000);
	}
}

function waitToPlay() {
	var $play = $('.page-main .play-icon.play-default');
	if ($play.length) $play.eq(0).click();
	else setTimeout(waitToPlay,500);

}