(function() {
  var $getStartedBtn = $('.js-get-started-btn');
  var $cpass = $('.js-cpass');
  var $pass = $('.js-pass');
  var $username = $('.js-username');
  var $closeBtn = $('.js-close-btn');
  var $createacctpopup = $('.js-createacctpopup');
  var $signinpopup = $('.js-signinpopup');
  var $signInBtn = $('.js-sign-in-btn');
  var $createAcctBtn = $('.js-create-acct-btn');
  var $vrforpresentations = $('.js-vrforpresentations');
  var $iphone = $('.js-iphone');
  var $darkbg = $('.js-darkbg');


  $iphone.hide().fadeIn(2000);
  $vrforpresentations.hide().delay(500).fadeIn(2000)

  $createAcctBtn.click(function(){
    $darkbg.show();
    $createacctpopup.fadeIn(500);
  });
  $signInBtn.click(function(){
    $darkbg.show();
    $signinpopup.fadeIn(500);
  });
  $closeBtn.click(function(){
  	$signinpopup.fadeOut(300);
    $createacctpopup.fadeOut(300);
    $darkbg.fadeOut(400);
  });
})();