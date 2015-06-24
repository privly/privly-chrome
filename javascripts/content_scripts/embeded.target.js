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

  var Target = function (target) {
    this.setNode(target);
  };
  Target.prototype = Object.create(Embeded.NodeResourceItem.prototype);

  /**
   * Override default destroy method behaviour because
   * our target element should not be destroyed.
   *
   * @override
   */
  Target.prototype.destroy = function () {
    return;
  };

  /**
   * If the embeded-posting app is closed, we need to re-focus
   * the target element.
   */
  Target.prototype.setState = function (state) {
    var self = this;
    switch (state) {
    case 'OPEN':
      self.detectResize();
      break;
    case 'CLOSE':
      self.getNode().focus();
      break;
    }
  };

  Target.createResource = function (targetNode) {
    var res = new Embeded.Resource();
    var targetInstance = new Embeded.Target(targetNode);
    var buttonInstance = new Embeded.Button(targetInstance);
    res.setInstance('target', targetInstance);
    res.setInstance('button', buttonInstance);
    res.attach();
    return res;
  };

  Target.onActivated = function (ev) {
    if (!Embeded.controller.enabled) {
      return;
    }
    var target = ev.target;
    if (!Embeded.util.isElementEditable(target)) {
      return;
    }
    target = Embeded.util.getOutMostTarget(target);
    var res = Embeded.resource.getByNode('target', target);
    if (res === null) {
      // this target has not been attached any Privly posting stuff
      res = Target.createResource(target);
    }
    Embeded.util.dispatchPrivlyEvent(target, 'PrivlyTargetActivated');
  };

  Target.onDeactivated = function (ev) {
    var target = ev.target;
    if (!Embeded.util.isElementEditable(target)) {
      return;
    }
    target = Embeded.util.getOutMostTarget(target);
    var res = Embeded.resource.getByNode('target', target);
    if (res === null) {
      // failed to retrive related resource
      // the DOM structure might be broken by the host page..
      // we don't handle this case.
      return;
    }
    Embeded.util.dispatchPrivlyEvent(target, 'PrivlyTargetDeactivated');
  };

  Target.addEventListeners = function () {
    document.addEventListener('click', Target.onActivated, false);
    document.addEventListener('focus', Target.onActivated, true);
    document.addEventListener('blur', Target.onDeactivated, true);
  };

  Target.addEventListeners();

  Target.prototype.onMessage = function (message, sendResponse) {
    switch (message.action) {
    case 'embeded/contentScript/getTargetContent':
      if (!this.isValid()) {
        sendResponse(false);
      } else {
        if (this.getNode().nodeName === 'TEXTAREA') {
          sendResponse(this.getNode().value);
        } else {
          sendResponse(this.getNode().innerHTML);
        }
      }
      break;
    case 'embeded/contentScript/getTargetText':
      if (!this.isValid()) {
        sendResponse(false);
      } else {
        if (this.getNode().nodeName === 'TEXTAREA') {
          sendResponse(this.getNode().value);
        } else {
          sendResponse(this.getNode().innerText);
        }
      }
      break;
    case 'embeded/contentScript/setTargetText':
      if (!this.isValid()) {
        sendResponse(false);
      } else {
        if (this.getNode().nodeName === 'TEXTAREA') {
          this.getNode().value = message.text;
        } else {
          this.getNode().innerText = message.text;
        }
      }
      break;
    case 'embeded/contentScript/emitEnterEvent':
      if (!this.isValid()) {
        sendResponse(false);
      } else {
        Embeded.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keydown', 13, message.keys);
        Embeded.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keypress', 13, message.keys);
        Embeded.util.dispatchInjectedKeyboardEvent(this.getNode(), 'keyup', 13, message.keys);
        sendResponse(true);
      }
      break;
    case 'embeded/contentScript/insertLink':
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
      break;
    case 'embeded/contentScript/appClosed':
      this.stopResizeMonitor();
      break;
    case 'embeded/contentScript/appStarted':
      this.startResizeMonitor();
      break;
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
    var node = this.getNode();
    var position = Embeded.util.position(node);
    var box = node.getClientRects()[0];

    if (
      box.width !== this._width || box.height !== this._height ||
        position.left !== this._left || position.top !== this._top
    ) {
      Embeded.util.dispatchPrivlyEvent(this.getNode(), 'PrivlyTargetPositionChanged');
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
