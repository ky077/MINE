$(function(){
	$(window).scroll(function(){
		if( $(window).scrollTop() > 200 ){
				$(".goTop").show();
		}else{
				$(".goTop").hide();
		}
	});

	$(".goTop").click(function(){
		$("html,body").animate({scrollTop:0},300);
		return false;
	});

});