/*global chrome */
/*global Embeded */
// If Privly namespace is not initialized, initialize it
var Embeded;
if (Embeded === undefined) {
  Embeded = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (Embeded.App !== undefined) {
    return;
  }

  var BORDER_STYLES = [
    'border-bottom-color',
    'border-bottom-style',
    'border-bottom-width',
    'border-left-color',
    'border-left-style',
    'border-left-width',
    'border-right-color',
    'border-right-style',
    'border-right-width',
    'border-top-color',
    'border-top-style',
    'border-top-width',
  ];

  var INHERIT_STYLES = [
    'color',
    'font-family',
    'font-size',
    'font-stretch',
    'font-style',
    'font-variant',
    'font-weight',
    'letter-spacing',
    'line-height',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'padding-top',
    'text-align',
    'text-anchor',
    'text-decoration',
    'text-indent',
    'text-shadow',
    'text-transform',
  ];

  var App = function (target, contextId, resId) {
    var iframe = document.createElement('iframe');
    this.node = iframe;

    this.appId = contextId + resId;

    var attrs = {
      'frameborder': '0',
      'scrolling': 'yes',
      'data-privly-exclude': 'true',
      // by telling the application our context id, the app can send message
      // back to us without using host-page message channel.
      'src': chrome.extension.getURL('privly-applications/Message/embeded.html' +
          '?contextid=' + encodeURIComponent(contextId) +
          '&resid=' + resId +
          '&appid=' + this.appId
        )
    };
    var key;
    for (key in attrs) {
      iframe.setAttribute(key, attrs[key]);
    }
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.display = 'none';
    iframe.style.boxSizing = 'border-box';
    iframe.style.zIndex = 2147483640;
    iframe.style.position = (target.getNode().nodeName !== 'BODY') ? 'absolute' : 'fixed';

    target.getNode().parentNode.appendChild(iframe);
  };

  App.prototype = Object.create(Embeded.NodeResourceItem.prototype);

  App.prototype.requestClose = function () {
    this.messageApp({
      action: 'embeded/app/userClose'
    });
  };

  App.prototype.onMessage = function (message, sendResponse) {
    switch (message.action) {
    case 'embeded/contentScript/appClosed':
      this.resource.setState('CLOSE');
      break;
    case 'embeded/contentScript/appStarted':
      this.resource.setState('OPEN');
      break;
    }
  };

  App.prototype.messageApp = function (message) {
    var messageToSend = JSON.parse(JSON.stringify(message));
    messageToSend.targetAppId = this.appId;
    Privly.message.messageExtension(messageToSend);
  };

  App.prototype.setState = function (state) {
    var self = this;
    switch (state) {
    case 'OPEN':
      self.adapt();
      Embeded.util.blockWindowSwitchingBlurEvent();
      self.getNode().focus();
      break;
    case 'CLOSE':
      self.destroy();
      break;
    }
    self.messageApp({
      action: 'embeded/app/stateChanged',
      state: state
    });
  };

  // TODO: refactor this function
  App.prototype.adapt = function () {
    var target = this.resource.getInstance('target').getNode();

    var box = target.getClientRects()[0];
    var position = Embeded.util.position(target);

    var bounding = {};
    bounding.top = position.top;
    bounding.top += Embeded.util.css(target, 'marginTop', true);
    bounding.left = position.left;
    bounding.left += Embeded.util.css(target, 'marginLeft', true);
    bounding.width = box.width;
    bounding.height = box.height;

    this.getNode().style.left = String(bounding.left) + 'px';
    this.getNode().style.top = String(bounding.top) + 'px';
    this.getNode().style.width = String(bounding.width) + 'px';
    this.getNode().style.height = String(bounding.height) + 'px';
    this.getNode().style.display = 'block';

    // copy styles
    var i;
    for (i = 0; i < BORDER_STYLES.length; ++i) {
      this.getNode().style[BORDER_STYLES[i]] = Embeded.util.css(target, BORDER_STYLES[i]);
    }

    // copy inner styles
    var styles = {};
    for (i = 0; i < INHERIT_STYLES.length; ++i) {
      styles[INHERIT_STYLES[i]] = Embeded.util.css(target, INHERIT_STYLES[i]);
    }

    this.messageApp({
      action: 'embeded/app/updateStyles',
      styles: styles
    });
  };

  Embeded.App = App;

}());
