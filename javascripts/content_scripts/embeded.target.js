/**
 * @fileOverview In charge of dealing with the editable target.
 * This module detects the resize of the target element and provides
 * interface for getting and setting the content of the target
 * element. It also provides inserting link (by emulating text input)
 * interface for other seamless posting modules.
 *
 * This module will handle and make respond to the following Privly messages:
 * embeded/contentScript/getTargetContent
 *   Get the content of the editable element.
 *   Returns value for textareas and innerHTML for contentEditable elements.
 * embeded/contentScript/getTargetText
 *   Get the text content of the editable element.
 *   Returns value for textareas and innerText for contentEditable elements.
 * embeded/contentScript/setTargetText
 *   Set the text content of the editable element.
 *   Set value for textareas and innerText for contentEditable elements.
 * embeded/contentScript/emitEnterEvent
 *   Emulate a key enter event on the target element with the given modify key.
 * embeded/contentScript/insertLink
 *   Insert link by emulating text input events to the target element.
 *
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    embeded/internal/targetPositionChanged
 *        when the size or the position of the target element has changed
 */
/*global Embeded */
// If Privly namespace is not initialized, initialize it
var Embeded;
if (Embeded === undefined) {
  Embeded = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (Embeded.Target !== undefined) {
    return;
  }

  /**
   * Embeded.Target receives the DOM of an editable element
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

  Target.prototype = Object.create(Embeded.NodeResourceItem.prototype);
  Target.prototype.super = Embeded.NodeResourceItem.prototype;

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
    this.super.addMessageListeners.call(this);
    this.addMessageListener('embeded/internal/stateChanged', this.onStateChanged.bind(this));
    this.addMessageListener('embeded/internal/targetActivated', this.onTargetActivated.bind(this));
    this.addMessageListener('embeded/internal/targetDeactivated', this.onTargetDeactivated.bind(this));
    this.addMessageListener('embeded/contentScript/getTargetContent', this.onGetTargetContent.bind(this));
    this.addMessageListener('embeded/contentScript/getTargetText', this.onGetTargetText.bind(this));
    this.addMessageListener('embeded/contentScript/setTargetText', this.onSetTargetText.bind(this));
    this.addMessageListener('embeded/contentScript/emitEnterEvent', this.onEmitEnterEvent.bind(this));
    this.addMessageListener('embeded/contentScript/insertLink', this.onInsertLink.bind(this));
  };

  /**
   * If the embeded-posting app is closed, we need to re-focus
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
    }
  };

  /**
   * Respond to emitEnterEvent message
   */
  Target.prototype.onEmitEnterEvent = function (message, sendResponse) {
    if (!this.isValid()) {
      sendResponse(false);
    } else {
      Embeded.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keydown', 13, message.keys);
      Embeded.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keypress', 13, message.keys);
      Embeded.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keyup', 13, message.keys);
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
      return;
    }
    var node = this.getNode();
    var position = Embeded.util.position(node);
    var box = node.getClientRects()[0];
    if (
      box.width !== this._width || box.height !== this._height ||
        position.left !== this._left || position.top !== this._top
    ) {
      this.resource.broadcastInternal({
        action: 'embeded/internal/targetPositionChanged'
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
    Embeded.util.dispatchTextEvent(this.getNode(), 'textInput', url);

    // Then we emulate inputing a space
    var ch = ' ';
    var chCode = ch.charCodeAt(0);
    Embeded.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keydown', chCode);
    Embeded.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keypress', chCode);
    Embeded.util.dispatchTextEvent(this.getNode(), 'textInput', ch);
    Embeded.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keyup', chCode);
  };

  Embeded.Target = Target;

}());
