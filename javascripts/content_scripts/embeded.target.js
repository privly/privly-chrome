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
   * Override default destroy method behaviour.
   * Our target element should not be destroyed.
   *
   * @override
   */
  Target.prototype.destroy = function () {
    return;
  };

  Target.prototype.setState = function (state) {
    var self = this;
    switch (state) {
    case 'CLOSE':
      self.getNode().focus();
      break;
    }
  };

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
    }
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
