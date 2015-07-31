/**
 * @fileOverview The file provides several useful
 * functions for seamless-posting.
 */
/*global SeamlessPosting */
/*global window */
// If Privly namespace is not initialized, initialize it
var SeamlessPosting;
if (SeamlessPosting === undefined) {
  SeamlessPosting = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (SeamlessPosting.util !== undefined) {
    return;
  }

  SeamlessPosting.util = {};

  /**
   * Get computed style of an element
   * 
   * @param  {Element} elem
   * @param  {string}  property
   * @param  {boolean} numeric  Should value return as a numeric value?
   * @return {string|Number} The computed style
   */
  SeamlessPosting.util.css = function (elem, property, numeric) {
    var value = window.getComputedStyle(elem)[property];
    if (numeric && value === '') {
      return 0;
    }
    if (numeric) {
      return parseFloat(value);
    }
    return value;
  };

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
  SeamlessPosting.util.offsetParent = function (elem) {
    var offsetParent = elem.offsetParent || document.documentElement;
    while (offsetParent && (offsetParent.nodeName !== 'HTML' && SeamlessPosting.util.css(offsetParent, 'position') === 'static')) {
      offsetParent = offsetParent.offsetParent;
    }
    return offsetParent || document.documentElement;
  };

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
  SeamlessPosting.util.offset = function (elem) {
    var box = elem.getBoundingClientRect();
    return {
      top: box.top + window.pageYOffset - document.documentElement.clientTop,
      left: box.left + window.pageXOffset - document.documentElement.clientLeft
    };
  };

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
  SeamlessPosting.util.position = function (elem) {
    var offset, offsetParent, parentOffset = {
      top: 0,
      left: 0
    };

    // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
    if (SeamlessPosting.util.css(elem, 'position') === 'fixed') {
      // We assume that getBoundingClientRect is available when computed position is fixed
      offset = elem.getBoundingClientRect();
    } else {
      // Get *real* offsetParent
      offsetParent = SeamlessPosting.util.offsetParent(elem);

      // Get correct offsets
      offset = SeamlessPosting.util.offset(elem);
      if (offsetParent.nodeName !== 'HTML') {
        parentOffset = SeamlessPosting.util.offset(offsetParent);
      }

      // Add offsetParent borders
      parentOffset.top += SeamlessPosting.util.css(offsetParent, 'borderTopWidth', true);
      parentOffset.left += SeamlessPosting.util.css(offsetParent, 'borderLeftWidth', true);
    }

    // Subtract parent offsets and element margins
    return {
      top: offset.top - parentOffset.top - SeamlessPosting.util.css(elem, 'marginTop', true),
      left: offset.left - parentOffset.left - SeamlessPosting.util.css(elem, 'marginLeft', true)
    };
  };

  /** 
   * The counter for uniquely marking the target element when executing scripts on the host page.
   * 
   * @type {Number}
   */
  var injectedIdentifier = 0;

  /**
   * Dispatch keyboard event on the target by using executing inline <script>.
   * 
   * Due to Chrome sandbox issues, we can't fire a keyboard event with correct charCode and keyCode
   * to the target in the content script.
   *
   * This workaround execute the script that fires the keyboard event in the context of the host page,
   * which can carry correct charCode and keyCode.
   *
   * This workaround is inspired and modified from:
   * http://stackoverflow.com/questions/13987380/how-to-to-initialize-keyboard-event-with-given-char-keycode-in-a-chrome-extensio
   * 
   * @param  {Element} target The element to fire the keyboard event
   * @param  {String} eventType The type of the keyboard event
   * @param  {Number} charCode charCode
   * @param  {Object} modifierKeys { ctrl, shift, alt, meta } Modifier keys of the keyboard event
   */
  SeamlessPosting.util.dispatchInjectedKeyboardEvent = function (target, eventType, charCode, modifierKeys) {
    // generate a identifier to access the element later in the context of the host page
    var attribute = 'privly_' + (++injectedIdentifier).toString(16);
    target.setAttribute(attribute, '');

    var selector = target.tagName + '[' + attribute + ']';

    // prepare to run in-page script
    var s = document.createElement('script');
    s.textContent = '(' + (function (eventType, charCode, modifierKeys, attribute, selector) {
      if (modifierKeys === undefined) {
        modifierKeys = {};
      }

      var element = document.querySelector(selector);
      element.removeAttribute(attribute);

      var evt = document.createEvent('Events');
      if (evt.initEvent) {
        evt.initEvent(eventType, true, true);
      }
      evt.ctrlKey = modifierKeys.ctrl || false;
      evt.altKey = modifierKeys.alt || false;
      evt.shiftKey = modifierKeys.shift || false;
      evt.metaKey = modifierKeys.meta || false;
      evt.charCode = charCode;
      evt.keyCode = charCode;
      evt.which = charCode;

      element.dispatchEvent(evt);

    }).toString() + ')(' + [eventType, charCode, modifierKeys, attribute, selector].map(function (v) {
      if (v === undefined) {
        return 'undefined';
      }
      return JSON.stringify(v);
    }).join(', ') + ')';

    // execute script
    (document.head || document.documentElement).appendChild(s);
    s.parentNode.removeChild(s);
  };

  /**
   * Dispatch text event on the target.
   * Expect to fire textInput event.
   * 
   * @param  {Element} target The element to fire the text event
   * @param  {String} eventType The type of the text event
   * @param  {String} char The content of the text event (can be a string)
   */
  SeamlessPosting.util.dispatchTextEvent = function (target, eventType, char) {
    var evt = document.createEvent('TextEvent');
    evt.initTextEvent(eventType, true, true, window, char, 0, 'en-US');
    target.dispatchEvent(evt);
  };

  /**
   * Dispatch mouse event on the target.
   * Expect to fire click event.
   * 
   * @param  {Element} target The element to fire the mouse event
   * @param  {String} eventType The type of the mouse event
   */
  SeamlessPosting.util.dispatchMouseEvent = function (target, eventType) {
    var evt = document.createEvent('MouseEvents');
    evt.initMouseEvent(eventType, true, true, window,
      1, 0, 0, 0, 0, false, false, false, false, 0, null);
    target.dispatchEvent(evt);
  };

  /**
   * Whether the element is an editable textarea or content-editable element.
   * 
   * @param  {Node}  element
   * @return {Boolean}
   */
  SeamlessPosting.util.isElementEditable = function (element) {
    return ((element.nodeName === 'TEXTAREA' && !element.readOnly && !element.disabled) || element.isContentEditable);
  };

  /**
   * For content editable elements, we may get its child element as the event target.
   * This function try to get the most outside content editable element for this
   * kind of circumstance.
   * 
   * @param  {Node} target
   * @return {Node}
   */
  SeamlessPosting.util.getOutMostTarget = function (target) {
    if (target.nodeName === 'HTML') {
      return null;
    }
    while (target.parentNode && target.parentNode.isContentEditable && target.parentNode.nodeName !== 'HTML') {
      target = target.parentNode;
    }
    return target;
  };

  // Before moving focus to another window, or another iframe,
  // we hijack the event listeners to prevent host page script
  // from receiving those blur messages.
  // 
  // Since we bind event on `window` object, blur event will fired twice
  // when window lose focus. (1: target blur, 2: window blur)
  var _blurLockCounter = {
    blur: 0,
    focusout: 0
  };

  /**
   * Call this function before opening new window.
   * This will prevent any event listeners on the host page
   * receiving blur and focusout events.
   */
  SeamlessPosting.util.blockWindowSwitchingBlurEvent = function () {
    _blurLockCounter = {
      blur: 2,
      focusout: 1
    };
  };

  // Those event listeners are binded at document_start (see manifest.json)
  // to get the highest event priority.
  function onWindowBlur(ev) {
    if (_blurLockCounter[ev.type]-- > 0) {
      ev.stopImmediatePropagation();
    }
  }

  window.addEventListener('blur', onWindowBlur, true);
  window.addEventListener('focusout', onWindowBlur, true);

}());
