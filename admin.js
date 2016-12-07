chrome.runtime.onMessage.addListener(function(request) {
	if (request.event == 'storage') gotStorage(request.storage);
});

function gotStorage(storage) {
	console.log(storage);

	for (i in storage) {
		console.log(i,storage[i]);
		storage[i] = (storage[i] != '') ? JSON.parse(storage[i]) : '';	
	}
	
	var user = storage.biggestDonate;
	if (user) $('#biggestDonate').html('$'+user.value+' '+user.name);

	var $divall = $('#alldonates').empty();
	var users = storage.allDonates;
	if (users) for (var i = 0; i < users.length && i < 5; i++) {
		var user = users[i];
		$('<div>$'+user.value+' '+user.name+'</div>').appendTo($divall);
	}

	var playing = storage.nowPlaying;
	if (playing) {
		$('#music .toset').html('<span class="title">'+playing.title.split('(')[0]+'<br/><span class="artist">por '+playing.artist+'</span>');
		$('#music .bgcover').css('background-image','url('+playing.cover+')');
	}
	
	for (id in storage.positions) {
		var p = storage.positions[id];
		var $obj = $('#'+id);
		if (!$obj.hasClass('locked')) $obj.css('top',p.top).css('left',p.left);
	}

	var $task = $('#task');
	if (!$task.hasClass('locked')) $task.val(storage.task.value);
}

$(window).ready(function() {
	$('.candrag').css('cursor','pointer').draggable({		
		start: function(ev) {
      		var $obj = $(this);			
      		$obj.addClass('locked');
		},
      	stop: function(ev) {
      		var $obj = $(this);
      		$obj.removeClass('locked');
      		var idobj = $obj.attr('id');
      		var left = $obj.css('left');
      		var top = $obj.css('top');
      		chrome.extension.sendRequest({'event':'update_pos','obj':idobj,'left':left,'top':top});
      	}
	});
	//$('.row > div').resizable();

	$('#task').on('focus',function() { $(this).addClass('locked'); });
	$('#task').on('blur',function() { $(this).addClass('locked'); });

	$('#task').keyup(function() {
		var val = $(this).val();
		chrome.extension.sendRequest({'event':'update_task','task':val});
	});

	chrome.extension.sendRequest({'event':'get_storage'},gotStorage);
});


function removePos(idobj) {
	chrome.extension.sendRequest({'event':'update_pos','obj':idobj,'left':0,'top':0});
}