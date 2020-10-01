jQuery(document).ready(function($) {

  // Header fixed and Back to top button
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('.back-to-top').fadeIn('slow');
      $('#header').addClass('header');
    } else {
      $('.back-to-top').fadeOut('slow');
      $('#header').removeClass('header');
    }
  });

  if ($(this).scrollTop() > 100) {
    $('.back-to-top').fadeIn('slow');
    $('#header').addClass('header');
  }

  $('.back-to-top').click(function() {
    $('html, body').animate({
      scrollTop: 0
    }, 1500, 'easeInOutExpo');
    return false;
  });

  //
  
$(function () {
  $(".box-hidden").slice(0, 8).show();
  $("#LoadMore").on('click',function (e) {
    e.preventDefault();
    $(".box-hidden:hidden").slice(0, 4).slideDown();
    if($(".box-hidden:hidden").length == 0) {
      $("#Load").fadeOut('slow');
    }
  });
  
});
});