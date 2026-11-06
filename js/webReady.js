$(document).ready(function() {
	//載入內容 start/////// /////// /////// /////// /////// /////// ///////
	$.each(data,function(name,values){
		$.each(values,function(idx,value){
			//標籤顯示
			var tagArray = value.tag;
			tagArray = $.map(tagArray, function (a) {
				return '<span class="label label-'+a+'">'+a+'</span>';
			});	
			//顯示內容
			var _html ='<div class="col-sm-6 col-md-4 web-item">'+
						  '<div class="embed-responsive embed-responsive-4by3">'+
							'<a role="button" class="web-item-a" data-toggle="modal" data-target="#modal-fancybox" data-id="'+value.id+'" data-photoNum="'+value.photoNum+'" data-linkHref="'+value.linkHref+'"></a>'+
							'<div class="web-item-text">'+
							  '<div class="date small">'+value.year+'</div>'+
							  '<h1 class="h4">'+value.name+'</h1>'+
							  '<div class="tag">'+
							  tagArray.join("")+
							  '</div>'+
							'</div>'+
							'<img class="web-item-img img-responsive center-block lazyload" alt="100%x100%"  src="img/loading.gif" data-src="WEBs/'+value.id+'/1.png">'+
						  '</div>'+
						'</div>';
			$('.webContent .row.webs').prepend(_html);
		});
	});//載入內容 end//
	
	//算數量
	$('.webContent .row.count strong').text($('.webContent .row.webs .web-item').size());
	
})


