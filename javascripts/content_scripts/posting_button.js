/*global privlyPosting:false, chrome:false, ls:true,  */

/**
 * This content-script provides Privly Posting Button feature.
 * It listens events of editable elements (textarea / contentEditable elements)
 * and create or show the posting button.
 *
 * The button is created as a sibling of the editable element, which enables
 * it to share the same parent with the editable element. This gives it better
 * positioning in most of situations. It works well even when the parent has
 * `position:fixed` style.
 */

var BUTTON_WIDTH = 16;
var BUTTON_HEIGHT = 16;
var BUTTON_MARGIN = 5;
var INTERVAL_UPDATE_POSITION = 500;
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
   * 
   * @param  {Element} elem
   * @param  {string}  property
   * @param  {boolean} numeric  Should value return as a numeric value?
   * @return {string|Number} The computed style
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
   * Get the closest ancestor element that is positioned
   * https://api.jquery.com/offsetParent/
   * 
   * jQuery.fn.offsetParent()
   * Ported from: https://github.com/jquery/jquery/blob/master/src/offset.js
   * 
   * @param  {Element} elem
   * @return {Element} The closest ancestor element that is positioned
   */
  offsetParent: function(elem) {
    var offsetParent = elem.offsetParent || document.documentElement;
    while (offsetParent && (offsetParent.nodeName !== "HTML" && PositionHelper.css(offsetParent, "position") === "static")) {
      offsetParent = offsetParent.offsetParent;
    }
    return offsetParent || document.documentElement;
  },

  /**
   * Get the current coordinates of the element, relative to the document.
   * https://api.jquery.com/offset/
   *
   * jQuery.fn.offset()
   * Ported from: https://github.com/jquery/jquery/blob/master/src/offset.js
   * 
   * @param  {Element} elem
   * @return {Object} An object containing the properties top and left.
   */
  offset: function(elem) {
    var box = elem.getBoundingClientRect();
    return {
      top: box.top + window.pageYOffset - document.documentElement.clientTop,
      left: box.left + window.pageXOffset - document.documentElement.clientLeft
    }
  },

  /**
   * Get the current coordinates of the element, relative to the offset parent.
   * https://api.jquery.com/position/
   * 
   * jQuery.fn.position()
   * Ported from: https://github.com/jquery/jquery/blob/master/src/offset.js
   *
   * @param  {Element} elem
   * @return {Object} An object containing the properties top and left.
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

/**
 * PrivlyButton Prototype Class
 * 
 * @param {Element} target The target to attach Privly button (an editable element)
 * @param {Element} btn   Optional, the Privly button element
 */
var PrivlyButton = function(target, btn) {
  this._target = target;
  if (btn !== undefined && btn instanceof Element) {
    this._button = btn;
  } else {
    // Create a div to handle the privly button
    var button = document.createElement("div");
    button.className = privlyButtonClassName;
    button.style.position = (target.nodeName !== "BODY") ? "absolute" : "fixed";
    button.style.cursor = "pointer";
    button.style.zIndex = 99999;
    button.style.opacity = 0;
    button.style.transition = "opacity 0.1s linear";
    button.style.background = "url(" + chrome.extension.getURL("images/logo_16.png") + ") no-repeat";
    button.style.width = String(BUTTON_WIDTH) + "px";
    button.style.height = String(BUTTON_HEIGHT) + "px";
    button.title = "New Privly message";

    button.addEventListener("mousedown", this.onMouseDown.bind(this));
    button.addEventListener("click", this.onClick.bind(this));
    button.addEventListener("mouseover", this.onMouseOver.bind(this));
    button.addEventListener("mouseout", this.onMouseOut.bind(this));

    target.parentNode.appendChild(button);
    button.offsetHeight; // force re-layout
    this._button = button;
    this.hide();
  }
};

/**
 * Event handler: avoid Privly Button getting focus
 * 
 * @param  {Event} ev
 */
PrivlyButton.prototype.onMouseDown = function(ev) {
  ev.preventDefault();
}

/**
 * Show post dialog
 */
PrivlyButton.prototype.onClick = function() {
  chrome.runtime.sendMessage({ask: "embeded/openPostDialog"}, (function(success) {
    if (success) {
      preventBlurEvent();
      privlyPosting.setReceiptNode(this._target);
      privlyPosting.isTargetFrame = true;
    }
  }).bind(this));
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
 */
PrivlyButton.prototype.updatePosition = function() {
  try {
    // we do not use offsetWidth and offsetHeight here, since it
    // will give us incorrect bounding box for wrapped inline elements.
    var box = this._target.getClientRects()[0];
    var targetRightTopCoverPosition = PositionHelper.position(this._target);
    targetRightTopCoverPosition.top += PositionHelper.css(this._target, "marginTop", true);
    targetRightTopCoverPosition.top += PositionHelper.css(this._target, "borderTopWidth", true);
    targetRightTopCoverPosition.left += PositionHelper.css(this._target, "marginLeft", true);
    targetRightTopCoverPosition.left += PositionHelper.css(this._target, "borderLeftWidth", true);
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
  } catch (e) {}
}

/**
 * Update the icon (black or white) based on the background color
 * only supports Chrome browser
 */
PrivlyButton.prototype.updateImage = function(callback) {
  var self = this;
  // Determine the button color according to the background
  chrome.runtime.sendMessage({ask: 'CaptureViewport'}, function (dataUrl) {
    if (dataUrl === undefined) {
      callback && callback();
      return;
    }

    // we use _target bound to calculate the sampling position
    // relative to the viewport. it can work without showing
    // the Privly button.
    var bound = self._target.getBoundingClientRect();
    var position = {left: bound.left - 1, top: bound.top - 1};
    var box = self._target.getClientRects()[0];
    position.top += PositionHelper.css(self._target, "marginTop", true);
    position.top += PositionHelper.css(self._target, "borderTopWidth", true);
    position.left += PositionHelper.css(self._target, "marginLeft", true);
    position.left += PositionHelper.css(self._target, "borderLeftWidth", true);
    position.left += box.width;
    
    // now we create a canvas to convert the captured image dataUrl
    // into pixel data.
    var canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function () {
      ctx.drawImage(img, 0, 0);
      // get sampling pixel color
      var data = ctx.getImageData(
        Math.floor(position.left),
        Math.floor(position.top),
        1, 1
      ).data;
      // calculate its luma
      var luma = 0.2126 * data[0] + 0.7152 * data[1] + 0.0722 * data[2];
      if (luma < 150) {
        // background is not light, use the white icon
        self._button.style.background = "url(" + chrome.extension.getURL("images/logo_16_white.png") + ") no-repeat";
      }
      callback && callback();
    };
    img.src = dataUrl;
  });
}

/**
 * Fade in button and make button clickable
 */
PrivlyButton.prototype.show = function() {
  this._button.style.opacity = 0.9;
  this._button.style.pointerEvents = 'auto';
  this.cancelPostponeHide();
}

/**
 * Enable position auto updater
 */
PrivlyButton.prototype.attachAutoPosition = function() {
  if (this._button.dataset.posTimer !== undefined) {
    return;
  }
  var timerId = setInterval((function() {
    this.updatePosition();
  }).bind(this), INTERVAL_UPDATE_POSITION);
  this._button.dataset.posTimer = timerId;
}

/**
 * Disable position auto updater
 */
PrivlyButton.prototype.detachAutoPosition = function() {
  if (this._button.dataset.posTimer !== undefined) {
    clearInterval(parseInt(this._button.dataset.posTimer));
    delete this._button.dataset.posTimer;
  }
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
  while (target.parentNode && target.parentNode.isContentEditable && target.parentNode.nodeName !== 'HTML') {
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
    return new PrivlyButton(target, buttons[0]);
  }
}

/**
 * Create event listeners
 */
function initEventListeners() {

  /**
   * Event handler when tagret is activated (click or focus)
   * 
   * @param  {Event} event
   */
  function onTargetActivated(event) {
    if (PrivlyButton.isTargetValid(event.target)) {
      var target = PrivlyButton.getOuterTarget(event.target);
      var button = PrivlyButton.getAttachedButton(target);
      var firstCreate = false;
      if (button === null) {
        // this target does not has a privly button attached
        button = new PrivlyButton(target);
        firstCreate = true;
      }
      button.updatePosition();

      var func = function (callback) { callback(); };
      if (firstCreate) {
        // for performance consideration, we only update button background
        // color once
        func = button.updateImage.bind(button);
      }
      func(function () {
        // show the button after its background has changed
        button.attachAutoPosition();
        button.show();
        button.postponeHide();
      });
    }
  }

  /**
   * Event handler when target is deactivated (blur)
   * 
   * @param  {Event} event
   */
  function onTargetDeactivated(event) {
    if (PrivlyButton.isTargetValid(event.target)) {
      var target = PrivlyButton.getOuterTarget(event.target);
      var button = PrivlyButton.getAttachedButton(target);
      if (button !== null) {
        button.detachAutoPosition();
        // If we click the button, onBlur will be triggered before onClick,
        // so we have to shortly postpone the hiding process.
        button.postponeHide(HIDE_DELAY_SHORT);
      }
    }
  }

  document.addEventListener("click", onTargetActivated, false);
  document.addEventListener("focus", onTargetActivated, true);
  document.addEventListener("blur", onTargetDeactivated, true);
}

chrome.runtime.sendMessage({ask: "options/isPrivlyButtonEnabled"}, function(enabled) {
  // Call the addPrivlyButton function only if the checkbox in the options
  // page is not checked
  if (enabled) {
    initEventListeners();
  }
});

// Before opening new window to post Privly, we hijack those blur events.
// 
// Since we bind event on `window` object, blur event will fired twice
// when window lose focus. (1: target blur, 2: window blur)
var stopEventOnce = {
  blur: 0,
  focusout: 0
};

/**
 * Call this function before opening new window.
 * This will prevent any event listeners on the host page
 * receiving blur and focusout events.
 */
function preventBlurEvent() {
  stopEventOnce = {
    blur: 2,
    focusout: 1
  };
}

// Bind events at document_start (see manifest.json)
// to get the highest event priority.
["blur", "focusout"].forEach(function(eventName) {
  window.addEventListener(eventName, function(ev) {
    if (stopEventOnce[ev.type]-- > 0) {
      ev.stopImmediatePropagation();
    }
  }, true);
});
