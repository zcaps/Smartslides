$(document).ready(function() {
  var $playbtn = $('.js-playbtn');
  var $playBtnContainer = $('.js-play-btn-container');
  var $editBtn = $('.js-edit-btn');
  var $presContainer = $('.js-pres-container');
  var $createBtn = $('.js-create-btn');
  var $presCloseBtn = $('.js-pres-popup-close-btn');
  var $presTitleInput = $('.js-pres-title-input');
  var $presCreateBtn = $('.js-create-presentation-btn');
  var $presCreatePopup = $('.js-pres-create-popup');
  var $presSpawner = $('.js-pres-spawner');
  var $darkbg = $('.js-dark-bg');
  
  function appendPresentation(title, key){
      $presSpawner.append('<div class="prescontainer clearfix js-pres-container" value='+key+'><p class="text">'+title+'</p>\
        <button class="_button js-edit-btn" onclick="location.href=\'\/editor?presentation='+key+'\';">Edit</button>\
        <div style="cursor:pointer;" class="container clearfix js-play-btn-container">\
        <img style="margin-left:4%;" class="image js-playbtn" src="images/playWhite.svg"\
        onclick="location.href=\'/speak?pid='+key+'&card=0\';"> </div></div>');
  }

  function updateSideButtons(selected){
    console.log(selected.length);
    if(selected.length == 0){
      $(".js-side-edit-btn").addClass("_button-greyed").removeClass("_button-hover")
      $(".js-side-speak-btn").addClass("_button-greyed").removeClass("_button-hover")
      $(".js-side-delete-btn").addClass("_button-greyed").removeClass("_button-hover")
    }
    else if(selected.length == 1){
      $(".js-side-edit-btn").removeClass("_button-greyed").addClass("_button-hover")
      $(".js-side-speak-btn").removeClass("_button-greyed").addClass("_button-hover")
      $(".js-side-delete-btn").removeClass("_button-greyed").addClass("_button-hover")
    }
    else{
      $(".js-side-edit-btn").addClass("_button-greyed").removeClass("_button-hover")
      $(".js-side-speak-btn").addClass("_button-greyed").removeClass("_button-hover")
    }
  }


  //  ===============   PRESENTATION IMPORTER   =====================  //
  $.get("/api/get-presentations", function(data, status){
    for(var key in data){
      appendPresentation(data[key].title, key);
        console.log(data)
    }
  });

  // Selector for presentation options
  var selected = []

  $presSpawner.on("click", ".prescontainer", function(){
    let key = $(this).attr("value")
    let keyInd = selected.indexOf(key);
    console.log("you clicked", key)
    if(keyInd == -1) {
      // Not selected, so select
      selected.push(key)
      $(this).css("box-shadow","0 8px 20px rgba(0, 0, 0, .7)")
    }
    else{
      // selected, so unselect
      $(this).css("box-shadow","0 2px 5px rgba(0, 0, 0, .5)")
      selected.splice(keyInd,1)
    }
    // Afterwards, update the buttons based on what is now available
    updateSideButtons(selected);
  })
    
  $(".js-side-edit-btn").click(function(){
    location.href='/editor?presentation='+selected[0]
  })

  $(".js-side-speak-btn").click(function(){
    location.href='/speak?pid='+selected[0] + '&card=0'
  })

  $(".js-side-delete-btn").click(function(){
    //calls delete presentation on all selected presentations
    for(var i=0; i<selected.length; i++){
      $presentations = $('.js-pres-spawner').find('.prescontainer')
      for(var j=0; j<$presentations.length;j++){
        if($($presentations[j]).attr("value") == selected[i]){
          $($presentations[j]).detach()
          break
      }
    }
    }
    let id = selected.pop()
    ajax_delete_pres(id)
  })
  $presSpawner.on("mouseover", ".js-pres-container", function(){
    $(this).find(".js-edit-btn").stop().fadeTo(500, 1);
    $(this).find(".js-play-btn-container").stop().fadeTo(500, 1);
    });
    
  $presSpawner.on("mouseleave", ".js-pres-container", function(){
    $(this).find(".js-edit-btn").stop().fadeTo(300, 0);
    $(this).find(".js-play-btn-container").stop().fadeTo(300,0);
  });
  
  $playbtn.css("cursor", "pointer");
  $playbtn.on("click", ".js-pres-container", function(){
    console.log("Play btn pressed");
  })

  $createBtn.click(function(){
    $darkbg.fadeIn(500);
    $presCreatePopup.fadeIn(500);
  });

  $presCloseBtn.click(function(){
    $darkbg.fadeOut(300);
    $presCreatePopup.fadeOut(300);
  });

  // Button Events
  // Hamburger menu
  $('.hamburger-icon').click(function(){
    $('#menu-pullout').show();

  })

  // Outside click hiding
  $(document).mouseup(function(event){
    if(!$('#menu-pullout').is(event.target) 
       && $('#menu-pullout').has(event.target).length == 0)
    {
      $('#menu-pullout').hide();
    }

  })
  function ajax_create_pres(){
    
    if($presTitleInput.val() == ""){
      $presTitleInput.css("border-color", "red");
    }
    else
      $presTitleInput.css("border-color", "lime");
    var presentationData = { "title": $presTitleInput.val() };
    
    $.ajax({
      type: "POST",
      url: "/api/create-presentation",
      contentType: "json",
      data: JSON.stringify(presentationData),
      success: function(response){
        console.log(response);
        appendPresentation(response.title, response.id)
        $darkbg.fadeOut(300);
        $presCreatePopup.fadeOut(300);
        $presTitleInput.css("border-color", "#cccccc")
        // if(response.redirect === "true"){
        //   window.location.href = "/user";
        // }
        // if(response.redirect === "false"){
        //   $presTitleInput.css("border","1px solid red");
        // }
        }
    });
  }

  function ajax_delete_pres(presId){
    
    data = {
      "presId": presId
    }
    $.ajax({
      type: 'POST',
      url: "/api/delete-presentation",
      contentType: 'json',
      data: JSON.stringify(data),
      success: function(res){
        if(res.result == true){
          if(selected.length > 0){
            let id = selected.pop()
            ajax_delete_pres(id)
          }
        }
      }
    })
  }
  // The mouse event
  $presCreateBtn.click(ajax_create_pres);

  // Or the `enter` press event
  $presTitleInput.keypress(function(event){
    if((event.keyCode ? event.keyCode : event.which) == '13')
      ajax_create_pres();
  })
});
