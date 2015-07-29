/**
 * @fileOverview In charge of dealing with the editable target.
 * This module detects the resize of the target element and provides
 * interface for getting and setting the content of the target
 * element. It also provides inserting link (by emulating text input)
 * interface for other seamless posting modules.
 *
 * This module will handle and make respond to the following Privly messages:
 *    posting/contentScript/getTargetContent
 *      Get the content of the editable element.
 *      Returns value for textareas and innerHTML for contentEditable elements.
 *    posting/contentScript/getTargetText
 *      Get the text content of the editable element.
 *      Returns value for textareas and innerText for contentEditable elements.
 *    posting/contentScript/setTargetText
 *      Set the text content of the editable element.
 *      Set value for textareas and innerText for contentEditable elements.
 *    posting/contentScript/emitEnterEvent
 *      Emulate a key enter event on the target element with the given modify key.
 *    posting/contentScript/insertLink
 *      Insert link by emulating text input events to the target element.
 *
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    posting/internal/targetPositionChanged
 *        when the size or the position of the target element has changed
 */
/*global SeamlessPosting */
// If Privly namespace is not initialized, initialize it
var SeamlessPosting;
if (SeamlessPosting === undefined) {
  SeamlessPosting = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (SeamlessPosting.Target !== undefined) {
    return;
  }

  /**
   * SeamlessPosting.Target receives the DOM of an editable element
   * and provide manipulation interface for the element.
   *
   * @class
   * @augments NodeResourceItem
   * 
   * @param {Element} target The editable element
   */
  var Target = function (target) {
    this.setNode(target);
    this.addMessageListeners();
  };

  Target.prototype = Object.create(SeamlessPosting.NodeResourceItem.prototype);
  Target.super = SeamlessPosting.NodeResourceItem.prototype;

  /**
   * Override default destroy method behaviour of NodeResourceItem because
   * our target element should not be destroyed and we also want to
   * stop the resize monitor.
   *
   * @override
   */
  Target.prototype.destroy = function () {
    this.stopResizeMonitor();
  };

  /**
   * Add message listeners
   *
   * @override
   */
  Target.prototype.addMessageListeners = function () {
    Target.super.addMessageListeners.call(this);
    this.addMessageListener('posting/internal/stateChanged', this.onStateChanged.bind(this));
    this.addMessageListener('posting/internal/targetActivated', this.onTargetActivated.bind(this));
    this.addMessageListener('posting/internal/targetDeactivated', this.onTargetDeactivated.bind(this));
    this.addMessageListener('posting/contentScript/getTargetContent', this.onGetTargetContent.bind(this));
    this.addMessageListener('posting/contentScript/getTargetText', this.onGetTargetText.bind(this));
    this.addMessageListener('posting/contentScript/setTargetText', this.onSetTargetText.bind(this));
    this.addMessageListener('posting/contentScript/emitEnterEvent', this.onEmitEnterEvent.bind(this));
    this.addMessageListener('posting/contentScript/insertLink', this.onInsertLink.bind(this));
  };

  /**
   * If the seamless-posting App is closed, we need to re-focus
   * the target element.
   */
  Target.prototype.onStateChanged = function (message) {
    this.state = message.state;
    switch (message.state) {
    case 'OPEN':
      this.detectResize();
      break;
    case 'CLOSE':
      this.getNode().focus();
      break;
    }
    this.updateResizeMonitor();
  };

  /** 
   * When target element is activated
   */
  Target.prototype.onTargetActivated = function () {
    this.activated = true;
    this.updateResizeMonitor();
  };

  /**
   * When target element is deactivated
   */
  Target.prototype.onTargetDeactivated = function () {
    this.activated = false;
    this.updateResizeMonitor();
  };

  /**
   * Determine whether the resize monitor timer should be started or stoped
   * according to the state (open or not) and activate state (focused or not)
   */
  Target.prototype.updateResizeMonitor = function () {
    if (this.activated || this.state === 'OPEN') {
      this.startResizeMonitor();
    } else if (!this.activated && this.state === 'CLOSE') {
      this.stopResizeMonitor();
    }
  };

  /**
   * Respond to getTargetContent message
   */
  Target.prototype.onGetTargetContent = function (message, sendResponse) {
    if (!this.isValid()) {
      sendResponse(false);
    } else {
      if (this.getNode().nodeName === 'TEXTAREA') {
        sendResponse(this.getNode().value);
      } else {
        sendResponse(this.getNode().innerHTML);
      }
    }
  };

  /**
   * Respond to getTargetText message
   */
  Target.prototype.onGetTargetText = function (message, sendResponse) {
    if (!this.isValid()) {
      sendResponse(false);
    } else {
      if (this.getNode().nodeName === 'TEXTAREA') {
        sendResponse(this.getNode().value);
      } else {
        sendResponse(this.getNode().innerText);
      }
    }
  };

  /**
   * Respond to setTargetText message
   */
  Target.prototype.onSetTargetText = function (message, sendResponse) {
    if (!this.isValid()) {
      sendResponse(false);
    } else {
      if (this.getNode().nodeName === 'TEXTAREA') {
        this.getNode().value = message.text;
      } else {
        this.getNode().innerText = message.text;
      }
      sendResponse(true);
    }
  };

  /**
   * Respond to emitEnterEvent message
   */
  Target.prototype.onEmitEnterEvent = function (message, sendResponse) {
    if (!this.isValid()) {
      sendResponse(false);
    } else {
      SeamlessPosting.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keydown', 13, message.keys);
      SeamlessPosting.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keypress', 13, message.keys);
      SeamlessPosting.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keyup', 13, message.keys);
      sendResponse(true);
    }
  };

  /**
   * Respond to insertLink message
   */
  Target.prototype.onInsertLink = function (message, sendResponse) {
    if (!this.isValid()) {
      sendResponse(false);
    } else {
      if (this.getNode().nodeName === 'TEXTAREA') {
        this.getNode().value = '';
      } else {
        this.getNode().innerHTML = '';
      }
      this.receiveURL(message.link);
      sendResponse(true);
    }
  };

  /**
   * Create an event if the target is resized or re-positioned.
   */
  Target.prototype.detectResize = function () {
    if (!this.isValid()) {
      this.stopResizeMonitor();
      return;
    }
    // only available when it is attached to a resource
    if (!this.resource) {
      this.stopResizeMonitor();
      return;
    }
    var node = this.getNode();
    var position = SeamlessPosting.util.position(node);
    var box = node.getClientRects()[0];
    if (box == undefined) {
      this.stopResizeMonitor();
      return;
    }
    if (
      box.width !== this._width || box.height !== this._height ||
        position.left !== this._left || position.top !== this._top
    ) {
      this.resource.broadcastInternal({
        action: 'posting/internal/targetPositionChanged'
      });
    }
  };

  /**
   * Start monitoring target resizing
   */
  Target.prototype.startResizeMonitor = function () {
    if (this.resizeMonitor) {
      return;
    }
    this.resizeMonitor = setInterval(this.detectResize.bind(this), 300);
  };

  /**
   * Stop monitoring target resizing
   */
  Target.prototype.stopResizeMonitor = function () {
    if (!this.resizeMonitor) {
      return;
    }
    clearInterval(this.resizeMonitor);
    this.resizeMonitor = null;
  };

  /**
   * Place the URL into the host page and fire
   * the appropriate events to get the host page
   * to process the link.
   * 
   * @param  {String} url The URL to insert into the editable element
   */
  Target.prototype.receiveURL = function (url) {
    // For efficiency, we directly insert all characters at once.
    SeamlessPosting.util.dispatchTextEvent(this.getNode(), 'textInput', url);

    // Then we emulate inputing a space
    var ch = ' ';
    var chCode = ch.charCodeAt(0);
    SeamlessPosting.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keydown', chCode);
    SeamlessPosting.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keypress', chCode);
    SeamlessPosting.util.dispatchTextEvent(this.getNode(), 'textInput', ch);
    SeamlessPosting.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keyup', chCode);
  };

  SeamlessPosting.Target = Target;

}());
