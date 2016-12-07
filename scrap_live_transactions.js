var list = [];

var months = ['','Jan','Fev','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

$('.subscription-div tr').each(function() {
	var $tr = $(this);
	var $tds = $tr.find('td');
	var username = $tds.eq(0).find('div a').text().trim();
	
	var dsdate = $tds.eq(1).text().trim();
	var pts = dsdate.split(' ');

	var day = parseInt(pts[0]);
	if (day < 10) day = '0'+day;

	var month = months.indexOf(pts[1]);
	if (month < 10) month = '0'+month;

	var year = parseInt(pts[2]);
	year = '20'+year;

	var date = year+'-'+month+'-'+day;

	var currency = $tds.eq(2).text().trim();
	var number = Number(currency.replace(/[^0-9\.]+/g,""));

	list.push({'username':username,'date':date,'number':number});
});

var dataRequest = {'event':'transactions','list':list};
chrome.extension.sendRequest(dataRequest,function(feed) {
	setTimeout(function() { location.reload(); },60000);
});