/**
 * @fileOverview This file handles the communication between
 * the Privly embeded-posting app and content scripts.
 *
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    embeded/internal/appBlurred
 *        when the embeded-posting app lost focus
 *
 *    embeded/internal/appFocused
 *        when the embeded-posting app got focus
 *
 */
/*global chrome */
/*global Privly, Embeded */
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
    this.addMessageListeners();

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

    // Listen embeded-posting-iframe onBlur events
    // to change the modal button.
    // 
    // onFocus event of the iframe doesn't have real effects :-(
    // So we detect onFocus inside the Privly application
    iframe.addEventListener('blur', this.onIFrameBlur.bind(this));

    target.getNode().parentNode.appendChild(iframe);
  };

  App.prototype = Object.create(Embeded.NodeResourceItem.prototype);
  App.prototype.super = Embeded.NodeResourceItem.prototype;

  /**
   * Add message listeners
   */
  App.prototype.addMessageListeners = function () {
    this.super.addMessageListeners.call(this);
    this.addMessageListener('embeded/internal/appFocused', this.onAppFocused.bind(this));
    this.addMessageListener('embeded/internal/appBlurred', this.onAppBlurred.bind(this));
    this.addMessageListener('embeded/internal/targetPositionChanged', this.onTargetPositionChanged.bind(this));
    this.addMessageListener('embeded/internal/stateChanged', this.onStateChanged.bind(this));
    this.addMessageListener('embeded/internal/closeRequested', this.onCloseRequested.bind(this));
    this.addMessageListener('embeded/contentScript/textareaFocus', this.onTextareaFocused.bind(this));
    this.addMessageListener('embeded/contentScript/appClosed', this.onAppClosed.bind(this));
    this.addMessageListener('embeded/contentScript/appStarted', this.onAppStarted.bind(this));
  };

  /**
   * When iframe lost focus
   */
  App.prototype.onIFrameBlur = function () {
    if (this.resource) {
      this.resource.broadcastInternal({
        action: 'embeded/internal/appBlurred'
      });
    }
  };

  // We just broadcast focus and blur events as messages
  // those messages will be handled in modal_button background
  // script.
  App.prototype.onAppFocused = function () {
    Privly.message.messageExtension({
      action: 'embeded/app/focus',
      appId: this.resource.id
    });
  };

  App.prototype.onAppBlurred = function () {
    Privly.message.messageExtension({
      action: 'embeded/app/blur',
      appId: this.resource.id
    });
  };

  App.prototype.onTargetPositionChanged = function () {
    if (this.resource && this.resource.getState() === 'OPEN') {
      this.reposition();
    }
  };

  /**
   * When textarea is focused
   */
  App.prototype.onTextareaFocused = function () {
    if (this.resource) {
      this.resource.broadcastInternal({
        action: 'embeded/internal/appFocused'
      });
    }
  };

  /**
   * When embeded-posting is closed
   */
  App.prototype.onAppClosed = function () {
    if (this.resource) {
      this.resource.setState('CLOSE');
    }
  };

  /**
   * When embeded-posting is started
   */
  App.prototype.onAppStarted = function () {
    if (this.resource) {
      this.resource.setState('OPEN');
      this.reposition();
    }
  };

  /**
   * when user requests to close the embeded-posting form
   */
  App.prototype.onCloseRequested = function () {
    this.messageApp({
      action: 'embeded/app/userClose'
    });
  };

  /**
   * When the resource state changed
   */
  App.prototype.onStateChanged = function (message) {
    switch (message.state) {
    case 'OPEN':
      this.copyStyle();
      Embeded.util.blockWindowSwitchingBlurEvent();
      this.getNode().focus();
      break;
    case 'CLOSE':
      this.destroy();
      break;
    }
    this.messageApp({
      action: 'embeded/app/stateChanged',
      state: message.state
    });
  };

  App.prototype.messageApp = function (message) {
    var messageToSend = JSON.parse(JSON.stringify(message));
    messageToSend.targetAppId = this.appId;
    return Privly.message.messageExtension(messageToSend);
  };

  /**
   * Recalculate the position of the embeded-posting iframe
   */
  App.prototype.reposition = function () {
    if (!this.resource) {
      return;
    }
    var target = this.resource.getInstance('target');
    if (target === null) {
      return;
    }
    var node = target.getNode();

    var position = Embeded.util.position(node);
    var box = node.getClientRects()[0];

    var bounding = {};
    bounding.top = position.top;
    bounding.top += Embeded.util.css(node, 'marginTop', true);
    bounding.left = position.left;
    bounding.left += Embeded.util.css(node, 'marginLeft', true);
    bounding.width = box.width;
    bounding.height = box.height;

    this.getNode().style.left = String(bounding.left) + 'px';
    this.getNode().style.top = String(bounding.top) + 'px';
    this.getNode().style.width = String(bounding.width) + 'px';
    this.getNode().style.height = String(bounding.height) + 'px';
    this.getNode().style.display = 'block';
  };

  /**
   * Copy some styles from the target to the embeded-posting
   * textarea to keep user experience consistent
   */
  App.prototype.copyStyle = function () {
    var target = this.resource.getInstance('target').getNode();

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

  /**
   * When the iframe node is removed, we also need to fire blur event
   * @param  {Event} ev
   */
  App.onDOMNodeRemoved = function (ev) {
    var node = ev.target;
    if (node.nodeName === 'IFRAME') {
      var res = Embeded.resource.getByNode('app', node);
      if (res === null) {
        return;
      }
      res.broadcastInternal({
        action: 'embeded/internal/appBlurred'
      });
    }
  };

  App.addEventListeners = function () {
    document.addEventListener('DOMNodeRemoved', App.onDOMNodeRemoved, false);
  };

  App.addEventListeners();

  Embeded.App = App;

}());
