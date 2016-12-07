var list = [];
var spans = $('.jspPane li span').each(function() { list.push($(this).text().trim()); });
console.log(list);
var data = {'list':list};
data;