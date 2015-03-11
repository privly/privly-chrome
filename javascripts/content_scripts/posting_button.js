/*global privlyUrlReceiptNode:false, pendingPost:false, chrome:false, ls:true,  */
(function() {

var BUTTON_WIDTH = 16;
var BUTTON_HEIGHT = 16;
var BUTTON_MARGIN = 5;
var HIDE_DELAY = 5000; // fade out after 5000 ms
var HIDE_DELAY_SHORT = 500; // fade out after 500 ms when lose focus

// create a unique className for privly button
// will be used to easily find the button from target container
var privlyButtonClassName = "privlyButton-" + Math.floor(Math.random() * 0xFFFFFFFF).toString(16);

/**
 * Helper methods to calculate correct position of an element.
 * Mainly ported from jQuery.fn.position()
 */
var PositionHelper = {
  /**
   * Get computed style of an element
   */
  css: function(elem, property, numeric) {
    var value = getComputedStyle(elem)[property];
    if (numeric) {
      if (value === "") {
        return 0;
      } else {
        return parseFloat(value);
      }
    } else {
      return value;
    }
  },

  /**
   * jQuery.fn.offsetParent()
   * Ported from: https://github.com/jquery/jquery/blob/master/src/offset.js
   */
  offsetParent: function(elem) {
    var offsetParent = elem.offsetParent || document.documentElement;
    while (offsetParent && (offsetParent.nodeName !== "HTML" && PositionHelper.css(offsetParent, "position") === "static")) {
      offsetParent = offsetParent.offsetParent;
    }
    return offsetParent || document.documentElement;
  },

  /**
   * jQuery.fn.offset()
   * Ported from: https://github.com/jquery/jquery/blob/master/src/offset.js
   */
  offset: function(elem) {
    var box = elem.getBoundingClientRect();
    return {
      top: box.top + window.pageYOffset - document.documentElement.clientTop,
      left: box.left + window.pageXOffset - document.documentElement.clientLeft
    }
  },

  /**
   * jQuery.fn.position()
   * Ported from: https://github.com/jquery/jquery/blob/master/src/offset.js
   */
  position: function(elem) {
    var offset, parentOffset = {
      top: 0,
      left: 0
    };

    // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
    if (PositionHelper.css(elem, "position") === "fixed") {
      // We assume that getBoundingClientRect is available when computed position is fixed
      offset = elem.getBoundingClientRect();
    } else {
      // Get *real* offsetParent
      var offsetParent = PositionHelper.offsetParent(elem);

      // Get correct offsets
      var offset = PositionHelper.offset(elem);
      if (offsetParent.nodeName !== "HTML") {
        parentOffset = PositionHelper.offset(offsetParent);
      }

      // Add offsetParent borders
      parentOffset.top += PositionHelper.css(offsetParent, "borderTopWidth", true);
      parentOffset.left += PositionHelper.css(offsetParent, "borderLeftWidth", true);
    }

    // Subtract parent offsets and element margins
    return {
      top: offset.top - parentOffset.top - PositionHelper.css(elem, "marginTop", true),
      left: offset.left - parentOffset.left - PositionHelper.css(elem, "marginLeft", true)
    };
  }
};

var PrivlyButton = function(btn) {
  if (btn !== undefined && btn instanceof Element) {
    this._button = btn;
  } else {
    // Create a div to handle the privly button
    var button = document.createElement("div");
    button.className = privlyButtonClassName;
    button.style.position = "absolute";
    button.style.cursor = "pointer";
    button.style.zIndex = 99999;
    button.style.transition = "opacity 0.1s linear";
    button.style.background = "url(" + chrome.extension.getURL("images/logo_16.png") + ") no-repeat";
    button.style.width = String(BUTTON_WIDTH) + "px";
    button.style.height = String(BUTTON_HEIGHT) + "px";
    button.title = "New Privly message";
    button.addEventListener("click", this.onClick.bind(this));
    button.addEventListener("mouseover", this.onMouseOver.bind(this));
    button.addEventListener("mouseout", this.onMouseOut.bind(this));
    this._button = button;
    this.hide();
  }
};

/**
 * Show new post window
 */
PrivlyButton.prototype.onClick = function() {
  if (!pendingPost) {
    chrome.runtime.sendMessage({ask: "newPost"}, function(response) {});
    privlyUrlReceiptNode = this._target;
  } else {
    chrome.runtime.sendMessage({ask: "showNotification"}, function(response) {});
  }
}

/**
 * Fade in button
 */
PrivlyButton.prototype.onMouseOver = function() {
  this.show();
};

/**
 * Fade out button after 5 seconds
 */
PrivlyButton.prototype.onMouseOut = function() {
  this.postponeHide();
};

/**
 * Re-calculate position of the button
 * @param  {Element} target
 */
PrivlyButton.prototype.updatePosition = function(target) {
  // we do not use offsetWidth and offsetHeight here, since it
  // will give us incorrect bounding box for wrapped inline elements.
  var box = target.getClientRects()[0];
  var targetRightTopCoverPosition = PositionHelper.position(target);
  targetRightTopCoverPosition.left += box.width;

  // calculate proper margins
  var horizontalMargin = BUTTON_MARGIN;
  if (box.width < (BUTTON_WIDTH + BUTTON_MARGIN * 2)) {
    horizontalMargin = Math.floor((box.width - BUTTON_WIDTH) / 2);
  }

  var verticalMargin = BUTTON_MARGIN;
  if (box.height < (BUTTON_HEIGHT + BUTTON_MARGIN * 2)) {
    verticalMargin = Math.floor((box.height - BUTTON_HEIGHT) / 2);
  }

  // set position of the button
  this._button.style.left = String(targetRightTopCoverPosition.left - horizontalMargin - BUTTON_WIDTH) + 'px';
  this._button.style.top = String(targetRightTopCoverPosition.top + verticalMargin) + 'px';
}

/**
 * Attach button to a target
 * @param  {Element} target
 */
PrivlyButton.prototype.attachTo = function(target) {
  this._target = target;
  var container = target.parentNode;
  container.appendChild(this._button);
}

/**
 * Fade in button and make button clickable
 */
PrivlyButton.prototype.show = function() {
  this._button.style.opacity = 0.7;
  this._button.style.pointerEvents = 'auto';
  this.cancelPostponeHide();
}

/**
 * Postpone to hide the button
 */
PrivlyButton.prototype.postponeHide = function(delay) {
  // cancel existing postpone process
  if (this._button.dataset.timer !== undefined) {
    this.cancelPostponeHide();
  }
  var timerId = setTimeout((function() {
    this.hide();
    delete this._button.dataset.timer;
  }).bind(this), delay || HIDE_DELAY);
  this._button.dataset.timer = timerId;
}

/**
 * Cancel postponed hiding
 */
PrivlyButton.prototype.cancelPostponeHide = function() {
  if (this._button.dataset.timer !== undefined) {
    clearTimeout(parseInt(this._button.dataset.timer));
    delete this._button.dataset.timer;
  }
}

/**
 * Fade out button and make button unclickable
 */
PrivlyButton.prototype.hide = function() {
  this.cancelPostponeHide();
  this._button.style.opacity = 0;
  this._button.style.pointerEvents = 'none';
}

/**
 * Create PrivlyButton instance from DOM
 * @param  {Element} button
 * @return {object}
 */
PrivlyButton.fromDOM = function(button) {
  return new PrivlyButton(button);
}

/**
 * Should privly button be placed for this target element?
 * 
 * @param  {Element}  target
 * @return {Boolean}
 */
PrivlyButton.isTargetValid = function(target) {
  return (target.nodeName === "TEXTAREA" || target.isContentEditable);
};

/**
 * Get the most outside target element
 * 
 * @param  {Element} target
 * @return {Element}
 */
PrivlyButton.getOuterTarget = function(target) {
  while (target.parentNode && target.parentNode.isContentEditable) {
    target = target.parentNode;
  }
  return target;
};

/**
 * Get the privly button attached to the target element
 * 
 * @param  {Element} target
 * @return {object} the privly button instance. return null if not attached.
 */
PrivlyButton.getAttachedButton = function(target) {
  var container = target.parentNode;
  var buttons = container.getElementsByClassName(privlyButtonClassName);
  if (buttons.length === 0) {
    return null;
  } else {
    return PrivlyButton.fromDOM(buttons[0]);
  }
}

function initEventListeners() {
  function onTargetActivated(event) {
    if (PrivlyButton.isTargetValid(event.target)) {
      var target = PrivlyButton.getOuterTarget(event.target);
      var button = PrivlyButton.getAttachedButton(target);
      if (button === null) {
        // this target does not has a privly button attached
        button = new PrivlyButton();
        button.attachTo(target);
      }
      button.updatePosition(target);
      button.show();
      button.postponeHide();
    }
  }
  function onTargetDeactivated(event) {
    if (PrivlyButton.isTargetValid(event.target)) {
      var target = PrivlyButton.getOuterTarget(event.target);
      var button = PrivlyButton.getAttachedButton(target);
      if (button !== null) {
        // If we click the button, onBlur will be triggered before onClick,
        // so we have to shortly postpone the hiding process.
        button.postponeHide(HIDE_DELAY_SHORT);
      }
    }
  }
  // would onMouseDown be a better choice?
  document.body.addEventListener("click", onTargetActivated, false);
  document.body.addEventListener("focus", onTargetActivated, true);
  document.body.addEventListener("blur", onTargetDeactivated, true);
}

chrome.runtime.sendMessage({ask: "PrivlyBtnStatus"}, function(response) {
  // Call the addPrivlyButton function only if the checkbox in the options
  // page is not checked
  if (response.tell === "unchecked") {
    initEventListeners();
  }
});


}());