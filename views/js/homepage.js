$(document).ready(function(){
  // UI Variables
  var $darkbg = $('.js-darkbg');
  var $createacctpopup = $('.js-createacctpopup');
  var $signinpopup = $('.js-signinpopup');

  var $signInBtn = $('.js-sign-in-btn');
  var $createAcctBtn = $('.js-create-acct-btn');
  var $vrforpresentations = $('.js-vrforpresentations');
  var $iphone = $('.js-iphone');
  var $closeBtn = $('.js-close-btn');

  // User Form Variables
  var $emailusername = $('.js-username');
  var $password = $('.js-pass');
  var $emailusernameLogin = $('.js-username1');
  var $passwordLogin = $('.js-pass1');
  var $confirm_password = $('.js-cpass');
  var $signupBtn = $('.js-get-started-btn');
  var $loginBtn = $('.js-sign-in-ajax-btn');

  // UI Animation and events
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
    $darkbg.fadeOut(400);
    $signinpopup.fadeOut(300);
    $createacctpopup.fadeOut(300);
  });

  // Event functions for input processing and AJAX
  function ajax_create_user(){
    var signupData = { "username": $emailusername.val(), "password": $password.val(), "confirm_password": $confirm_password.val() };

    $signupBtn.text("Processing...")
    $emailusername.css("border","0px");
    $password.css("border","0px");
    $confirm_password.css("border","0px");

    $.ajax({
      type: "POST",
      url: "/api/create-account",
      contentType: "json",
      data: JSON.stringify(signupData),
      success: function(response){
        console.log(response);
        console.log(document.cookie)
        if(response.result == true){
          // Redirect
          $signupBtn.text("Redirecting...")
          $emailusername.css("border", "1px solid lime")
          $password.css("border","1px solid lime");
          $confirm_password.css("border","1px solid lime");
          location.href = '/user'
        }
        else{
          // If bad request, analyze
          $signupBtn.text(response.result)
          // Password mismatch
          if(response.result == "Passwords Don't Match" 
              || response.result == "Password Must Be Atleast 8 Characters"){
            $password.css("border","1px solid red");
            $confirm_password.css("border","1px solid red");
          }
          // Username exists
          if(response.result == "Username Already Exists"){
            $emailusername.css("border", "1px solid red")
          }
        }
      },
      error : function(){
        console.log("Ajax Error : ")
      }
    });
  }

  // User Form Processes and API calls
  $signupBtn.click(ajax_create_user);

  $confirm_password.keypress(function(event){
    if((event.keyCode ? event.keyCode : event.which) == '13') 
      ajax_create_user();
  })


  ////
  //  Login function
  ////
  function Login(){
    var data = {
      "username": $emailusernameLogin.val(),
      "password": $passwordLogin.val()
    }
    $.ajax({
      type:'POST',
      url: "/api/sign-in",
      contentType: 'json',
      data: JSON.stringify(data),
      success: function(res){
        console.log(res)
        if(res.result == "Username Doesn't exist"){
          //Username doesn't exist
          $emailusernameLogin.css("border", "1px solid #FF9494")
        }
        if(res.result == false){
          //Bad Password
          $emailusernameLogin.css("border", "0px solid #FF9494")
          $passwordLogin.css("border", "1px solid #FF9494")
        }
        if(res.result == true){
          //redirect
          window.location.reload()
        }
      }
      
    })
  }
  $loginBtn.click(Login)
  
});
