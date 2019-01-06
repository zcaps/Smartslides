(function() {
  var $btnSave = $('.js-btn-save');
  var $notecardEntry = $('.js-notecard-entry');
  var $notecardText = $('.js-notecard-text');
  var $notecardBox = $('.js-notecard-box');
  var $hideArrow = $('.js-hide-arrow');
  var $sidebarHandle = $('.js-sidebar-handle');
  var $sidebar = $('.js-sidebar');


  var $sbHidden = true
  var $toggleSideBar = function() {
    if ($sbHidden) {
      $sidebar.animate({
        left: "+=313"
      }, 700, function() {});
      $sbHidden = false
    } else {
      $sidebar.animate({
        left: "-=313"
      }, 700, function() {});
      $sbHidden = true
    }
  }

  $sidebarHandle.click($toggleSideBar)
  $hideArrow.click($toggleSideBar)

  var $mouseOverHandle = function() {
    if ($sbHidden) {
      $sidebar.animate({
        left: "+=4"
      }, 400, function() {});
    }
  }
  var $mouseLeaveHandle = function() {
    if ($sbHidden) {
      $sidebar.animate({
        left: "-=4"
      }, 400, function() {});
    }
  }

  $sidebar.mouseover($mouseOverHandle)
  $sidebar.mouseout($mouseLeaveHandle)
})();