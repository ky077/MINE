$(window).load(function() {	
	
	$('.web-item-a[data-toggle="modal"]').click(showFancybox);

	//search start/////// /////// /////// /////// /////// /////// ///////
	jQuery.expr[':'].Contains = function(a, i, m) {
		return jQuery(a).text().toLowerCase().indexOf(m[3].toLowerCase()) >= 0;
	};
	$alldata = $('.webContent .row.webs').html();
	$('.ky-search input[type=text]').keyup(function () {
		$('.webContent .row.webs').html($alldata);

		var searchText = $(this).val();//獲取輸入的搜尋內容
		var $searchLi = "";//預備物件，用於儲存匹配出的li
		if (searchText != "") {
			//獲取所有匹配的li
			$searchLi = $('.webContent .row.webs').find('h1:Contains('+searchText+'), .date:Contains('+searchText+'), .tag .label:Contains('+searchText+')').parents('.web-item');
			//將內容清空
			$('.webContent .row.webs').html("");
		}
		//將獲取的元素追加到列表中
		$('.webContent .row.webs').html($searchLi).clone();	
		$('.webContent .row.count strong').text($('.webContent .row.webs .web-item').size());
		$(window).trigger('resize');
		
		//判斷搜尋內容是否有效，若無效，輸出not find
		if ($searchLi.length <= 0) {
			$('.webContent .row.webs').html('<div class="alert-noData text-center"><big>No data found.</big></div><div class="alert-noData text-center">Please try again, or look for <a href="index.html">all data</a>.</div>')
		}
		if (searchText == "") {
			$('.webContent .row.webs').html($alldata);
			$('.webContent .row.count strong').text($('.webContent .row.webs .web-item').size());
		}
		
		$('.web-item-a[data-toggle="modal"]').click(showFancybox);
	})
	$('.ky-search input[type=submit]').click(function () {
		$(searchText).keyup();
	});//search end//
	
	
	//修正圖片height過小 start/////// /////// /////// /////// /////// /////// ///////
	$(window).trigger('resize');
	//修正圖片height過小 end//
})


$(window).on('resize',function() {	
	//修正圖片height過小 start/////// /////// /////// /////// /////// /////// ///////
	
	
	$('.webContent .web-item .web-item-img').each(function(){
		var $blockHeight =  $(this).parents('.web-item').height();
		
		if( $(this).height() < $blockHeight){
			$(this).css({
				'height': $blockHeight,
			});
		}else if( $(this).height() >= $blockHeight){
			$(this).css({
				'max-width': '100%',
    			'height': 'auto',
			});
		}
	});//修正圖片height過小 end//
});


function showFancybox(e) {   
	$thisID			=	$(this).attr('data-id');       
	$thisName		= 	$(this).next('.web-item-text').find('h1').text();
	$thisYear		= 	$(this).next('.web-item-text').find('.date').text();
	$thisTag		= 	$(this).next('.web-item-text').find('.tag').html();
	$thisPhotoNum	=	$(this).attr('data-photoNum'); 
	 
	if( $(this).attr('data-linkHref') !=""){
		var _thisLinkHTML = '<a type="button" class="btn btn-default pull-right" target="_blank" href="'+ $(this).attr('data-linkHref') +'"><span class="glyphicon glyphicon-new-window" aria-hidden="true"></span>&nbsp;link</a>';
	}else{
		var _thisLinkHTML = "";
	} 
	
	$('#modal-fancybox').on('show.bs.modal', function (e) {
		$(this).find('.modal-header').html('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
		$(this).find('.modal-body').html('');
		$(this).find('.modal-header .close').after(
			'<div class="web-item">'+
				'<h1 class="h3">'+
					$thisName+
					'&nbsp;<small>'+$thisYear+
						'&nbsp;<span class="tag">'+
							$thisTag+
						'</span>'+
					'</small>'+ 
					_thisLinkHTML+
				'</h1>'+
			'</div>'
		);
		
		for (var i=1; i<=$thisPhotoNum; i++) {
			var _photoHTML = '<img src="WEBs/'+$thisID+'/'+i+'.png" class="img-responsive center-block">';
			$(this).find('.modal-body').append(_photoHTML);
		}
	});    
}


