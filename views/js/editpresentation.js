function GetURLParameter(sParam)
{
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++)
    {
      var sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] == sParam)
      {
          return decodeURIComponent(sParameterName[1]);
      }
    }
}

function saveNotecardToDb(presId, notecardContent, prevNotecardId){
  var presentationData =  { 
                            "Id": presId,
                            "Notecards": [{
                              "id": prevNotecardId,
                              "Content": notecardContent
                            }]
                          };
  
  return $.ajax({
    type: "POST",
    url: "/api/update-presentation",
    contentType: "json",
    data: JSON.stringify(presentationData),
    success: function(response){
      //console.log(response);
    }
  });
}
function updateNotecardInDb(presId, notecardContent, prevNotecardId){
  var presentationData =  { 
                            "Id": presId,
                            "Notecards": [{
                              "id": prevNotecardId,
                              "Content": notecardContent
                            }]
                          };
  
  return $.ajax({
    type: "POST",
    url: "/api/update-notecard",
    contentType: "json",
    data: JSON.stringify(presentationData),
    success: function(response){
      //console.log(response);
    }
  });
}

$(document).ready(function() {
  var $blackplus = $('.js-blackplus');
  var $whiteplus = $('.js-whiteplus');
  var $insertNotecardBtn = $('.js-insert-notecard-btn');
  var $deleteBtn = $('.js-delete-btn');
  var $editBtn = $('.js-edit-btn');
  var $notecard = $('.js-notecard');
  var $presTitle = $('.js-pres-title');
  var $editorContainer = $('.js-text-editor');
  var $notecardContainer = $('.js-notecard-container');
  var $notecardElement = $('.js-notecard-element');

  // The infamous counter. What is it counting? What are it's plans? We'll never know.
  var counter = 0;

  // Initial presentation import
  $.get("/api/get-presentation/"+GetURLParameter('presentation'), function(data, status){
    if(!data){
      window.location.href = "/"
    }
    $presTitle.html(data.title);
    
    for(var key in data.notecards){
      appendNotecard(counter, data.notecards[key].id)
      $('.js-notecard').find("#editor"+counter).find(".ql-editor").html(data.notecards[key].Content);
      $('.js-notecard').find(".js-editor-html"+counter).html(data.notecards[key].Content)
      counter++;
    }
    if(counter == 0){
      // Make the one working button. 
      console.log("I'm making my own!")
      let addBtn = $('<div></div>').addClass("element element-1 clearfix js-insert-notecard-btn")
      let btn_white = $("<img>").addClass("image image-1 js-whiteplus").attr("src","images/plus(2).svg")
      let btn_black = $("<img>").addClass("image image-2 js-blackplus").attr("src","images/plus.svg")
      addBtn.append(btn_white);
      addBtn.append(btn_black);
      $('.js-notecard-container').append(addBtn);
    }
  });

  //hover function to fade in the white plus sign
  $notecardContainer.on("mouseenter", ".js-insert-notecard-btn", function(){
    $(this).find(".js-blackplus").stop().fadeOut(100);
  });
  $notecardContainer.on("mouseleave", ".js-insert-notecard-btn", function(){
    $(this).find(".js-blackplus").fadeIn(100);
  });

  //hover function to fade in the delete and edit buttons
  $notecardContainer.on("mouseenter", ".js-notecard", function(){
    $(this).find(".js-edit-btn").fadeIn(500);
    $(this).find(".js-delete-btn").fadeIn(500);
  });
  $notecardContainer.on("mouseleave", ".js-notecard", function(){
   $(this).find(".js-edit-btn").stop().fadeOut(500);
   $(this).find(".js-delete-btn").stop().fadeOut(500);
  });

  // ======== CLICK EVENTS ======== //
  // Back icon
  $('#back-icon').click(function(){
    window.location.href = "/user"
  })

  //function to handle click events on the edit button
  $notecardContainer.on("click", ".js-edit-btn",function(){
    var thisNotecard = $(this).parent();
    if($(this).html() === "Edit"){
      thisNotecard.find("div[class^='js-editor-html']").hide();
      thisNotecard.find(".js-text-editor").fadeIn(500);
      thisNotecard.css("background-color", "#fff");
      $(this).html("Save");
    }else{
      $(this).html("Edit");
      thisNotecard.find(".js-text-editor").fadeOut(500);
      thisNotecard.css("background-color", "");
      var insertionId = thisNotecard.parent().prev().attr("value");
      var notecardContent = thisNotecard.find($(".ql-editor")).html();
      if(thisNotecard.parent().attr("value") === "null"){
        //Notecard Doesn't Exist
        saveNotecardToDb(GetURLParameter("presentation"), notecardContent, insertionId).done(function(response){
          thisNotecard.parent().attr("value", response["Id"])
          thisNotecard.find(".js-delete-btn").attr("value", response["Id"]);
        });
      }else{
        //Notecard Exists
        insertionId = thisNotecard.parent().attr("value");
        updateNotecardInDb(GetURLParameter("presentation"), notecardContent, insertionId);
      }
      let notecardContentContainer = thisNotecard.find("div[class^='js-editor-html']");
      notecardContentContainer.hide();
      notecardContentContainer.html(notecardContent);
      notecardContentContainer.delay(600).fadeIn(300);
      
      
      
    }
  });

  //function to handle click events on the trashcan button
  $notecardContainer.on("click", ".js-delete-btn",function(){
    if (!confirm("This is irreversible! Are you sure you want to delete this notecard?")) return;
    var data = { 
      "Amount": $(this).attr("value"),
      "Id": GetURLParameter("presentation")
    };
    console.log(data["Amount"]);
    $.ajax({
      type: "POST",
      url: "/api/delete-notecard",
      contentType: "json",
      data: JSON.stringify(data),
      success: function(response){
        //console.log(response);
        
      }
    });
    $(this).parent().parent().remove();
  });

  //Append a new notecard after clicking the button
  $notecardContainer.on("click", ".js-insert-notecard-btn", function(){
    console.log($(this).parent().attr("value"))
    
    counter++;
   //console.log(editor);
    var notecardId = $(this).parent();
    appendNotecard(counter, null, notecardId);
  }); 

  
});
function appendNotecard(counter, notecardId, after){
  var data = '<div class="js-notecard-element" value="'+notecardId+'">\
\
    <div class="element _element element-4"></div>\
    <div class="element element-2 clearfix js-notecard">\
      <button class="_button js-edit-btn">Edit</button>\
      <div class="element element-3 clearfix js-delete-btn" value="'+notecardId+'">\
        <img class="image image-3" src="images/trash(2).svg">\
      </div>\
      <div style="height:7%;"></div>\
      <div class="js-text-editor" style="display:none;height:83%;">\
      <div id="toolbar'+counter+'">\
          <select class="ql-size">\
              <option value="small"></option>\
            \
              <option selected></option>\
              <option value="large"></option>\
              <option value="huge"></option>\
          </select>\
        <button class="ql-bold"></button>\
        <button class="ql-italic"></button>\
        <button class="ql-underline"></button>\
        <button class="ql-link"></button>\
        <button class="ql-list" value="ordered"></button>\
        <button class="ql-list" value="bullet"></button>\
        <button id="keyword'+counter+'"><img src="images/kw.png"></button>\
        \
      </div>\
      <div id="editor'+counter+'"></div>\
      </div>\
      <div class="js-editor-html'+counter+' ql-container ql-editor" style="height:83%; font-family:sans;">\
        \
      </div>\
    </div>\
    \
    <div class="element _element element-6"></div>\
    <div class="element element-5 clearfix js-insert-notecard-btn">\
      <img class="image image-4 js-whiteplus" src="images/plus(2).svg">\
      <img class="image image-5 js-blackplus" src="images/plus.svg">\
    </div>\
    </div>';
    if(notecardId == null && counter != 1){
      $(data).insertAfter(after);
    }else{
      $('.js-notecard-container').append(data);
    }
    
    var quill = new Quill("#editor"+counter, {
      placeholder: 'Compose an epic...',
      theme: 'snow',
      modules:{
        toolbar:"#toolbar"+counter
      }
    });

    var customButton = document.querySelector("#keyword" + counter);
    customButton.addEventListener('click', function() {
      var range = quill.getSelection();
      if (range) {
        quill.formatText(range.index, range.length, 'color', 'red')
      }
    });

}