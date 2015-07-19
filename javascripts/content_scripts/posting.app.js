/**
 * @fileOverview This file handles the communication between
 * the Privly seamless-posting app and content scripts.
 *
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    posting/internal/appBlurred
 *        when the seamless-posting app lost focus
 *
 *    posting/internal/appFocused
 *        when the seamless-posting app got focus
 *
 */
/*global chrome */
/*global Privly, SeamlessPosting */
// If Privly namespace is not initialized, initialize it
var SeamlessPosting;
if (SeamlessPosting === undefined) {
  SeamlessPosting = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (SeamlessPosting.App !== undefined) {
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

  var App = function () {
    this.addMessageListeners();
  };

  App.prototype = Object.create(SeamlessPosting.NodeResourceItem.prototype);
  App.super = SeamlessPosting.NodeResourceItem.prototype;

  /**
   * @override
   */
  App.prototype.attachResource = function (res) {
    App.super.attachResource.call(this, res);

    /**
     * A unique id to identify the app
     * @type {String}
     */
    this.appId = 'posting.app.' + SeamlessPosting.service.contextId + res.id;

    this.createDOM();
  };

  /**
   * @override
   */
  App.prototype.detachResource = function () {
    App.super.detachResource.call(this);
    // remove node
    if (this.getNode() && this.getNode().parentNode) {
      this.getNode().parentNode.removeChild(this.getNode());
    }
    this.setNode(null);
  };

  /**
   * Create the iframe element of the App
   */
  App.prototype.createDOM = function () {
    var target = this.resource.getInstance('target');
    if (!target) {
      return;
    }
    if (!target.getNode()) {
      return;
    }
    var targetNode = target.getNode();

    var node = document.createElement('iframe');
    var attrs = {
      'frameborder': '0',
      'scrolling': 'yes',
      'data-privly-exclude': 'true',
      // by telling the application our context id, the app can send message
      // back to us without using host-page message channel.
      'src': chrome.extension.getURL('privly-applications/Message/seamless.html' +
          '?contextid=' + encodeURIComponent(SeamlessPosting.service.contextId) +
          '&resid=' + encodeURIComponent(this.resource.id) +
          '&appid=' + encodeURIComponent(this.appId)
        )
    };
    var key;
    for (key in attrs) {
      node.setAttribute(key, attrs[key]);
    }
    node.style.width = '0';
    node.style.height = '0';
    node.style.display = 'none';
    node.style.boxSizing = 'border-box';
    node.style.zIndex = 2147483640;
    node.style.position = (targetNode.nodeName !== 'BODY') ? 'absolute' : 'fixed';

    // Listen seamless-posting iframe onBlur events
    // to change the modal button.
    // 
    // onFocus event of the iframe doesn't have real effects :-(
    // So we detect onFocus inside the Privly application
    node.addEventListener('blur', this.onIFrameBlur.bind(this));
    targetNode.parentNode.appendChild(node);

    this.setNode(node);
  };

  /**
   * Add message listeners
   */
  App.prototype.addMessageListeners = function () {
    App.super.addMessageListeners.call(this);
    this.addMessageListener('posting/internal/appFocused', this.onAppFocused.bind(this));
    this.addMessageListener('posting/internal/appBlurred', this.onAppBlurred.bind(this));
    this.addMessageListener('posting/internal/targetPositionChanged', this.onTargetPositionChanged.bind(this));
    this.addMessageListener('posting/internal/stateChanged', this.onStateChanged.bind(this));
    this.addMessageListener('posting/internal/closeRequested', this.onCloseRequested.bind(this));
    this.addMessageListener('posting/contentScript/textareaFocused', this.onTextareaFocused.bind(this));
    this.addMessageListener('posting/contentScript/appClosed', this.onAppClosed.bind(this));
    this.addMessageListener('posting/contentScript/appStarted', this.onAppStarted.bind(this));
    this.addMessageListener('posting/contentScript/TTLChanged', this.onTTLChanged.bind(this));
  };

  /**
   * When user changed seconds_until_burn
   */
  App.prototype.onTTLChanged = function (message) {
    this.messageApp({
      action: 'posting/app/setTTL',
      ttl: message.value
    });
  };

  /**
   * When iframe lost focus
   */
  App.prototype.onIFrameBlur = function () {
    if (this.resource) {
      this.resource.broadcastInternal({
        action: 'posting/internal/appBlurred'
      });
    }
  };

  // We just broadcast focus and blur events as messages
  // those messages will be handled in modal_button background
  // script.
  App.prototype.onAppFocused = function () {
    Privly.message.messageExtension({
      action: 'posting/app/focused',
      appId: this.resource.id
    });
  };

  App.prototype.onAppBlurred = function () {
    Privly.message.messageExtension({
      action: 'posting/app/blurred',
      appId: this.resource.id
    });
  };

  /**
   * When position or size of the target has changed
   */
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
        action: 'posting/internal/appFocused'
      });
    }
  };

  /**
   * When seamless-posting App is closed
   */
  App.prototype.onAppClosed = function () {
    if (this.resource) {
      this.resource.setState('CLOSE');
    }
  };

  /**
   * When seamless-posting App is started
   */
  App.prototype.onAppStarted = function () {
    if (this.resource) {
      this.resource.setState('OPEN');
      this.reposition();
    }
  };

  /**
   * when user requests to close the seamless-posting form
   */
  App.prototype.onCloseRequested = function () {
    this.messageApp({
      action: 'posting/app/userClose'
    });
  };

  /**
   * When the resource state changed
   */
  App.prototype.onStateChanged = function (message) {
    switch (message.state) {
    case 'OPEN':
      this.copyStyle();
      SeamlessPosting.util.blockWindowSwitchingBlurEvent();
      this.getNode().focus();
      break;
    case 'CLOSE':
      this.destroy();
      break;
    }
    this.messageApp({
      action: 'posting/app/stateChanged',
      state: message.state
    });
  };

  /**
   * Send message to the app. Those messages are forwarded
   * by the background script
   * 
   * @param  {Object} message
   * @param  {Boolean} hasResponse  Does this message expected to
   *                                receive a response?
   * @return {Promise}
   */
  App.prototype.messageApp = function (message, hasResponse) {
    var messageToSend = JSON.parse(JSON.stringify(message));
    messageToSend.targetAppId = this.appId;
    messageToSend.hasResponse = hasResponse;
    return Privly.message.messageExtension(messageToSend);
  };

  /**
   * Recalculate the position of the seamless-posting iframe
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

    var position = SeamlessPosting.util.position(node);
    var box = node.getClientRects()[0];

    var bounding = {};
    bounding.top = position.top;
    bounding.top += SeamlessPosting.util.css(node, 'marginTop', true);
    bounding.left = position.left;
    bounding.left += SeamlessPosting.util.css(node, 'marginLeft', true);
    bounding.width = box.width;
    bounding.height = box.height;

    this.getNode().style.left = String(bounding.left) + 'px';
    this.getNode().style.top = String(bounding.top) + 'px';
    this.getNode().style.width = String(bounding.width) + 'px';
    this.getNode().style.height = String(bounding.height) + 'px';
    this.getNode().style.display = 'block';
  };

  /**
   * Copy some styles from the target to the seamless-posting
   * textarea to keep user experience consistent
   */
  App.prototype.copyStyle = function () {
    var target = this.resource.getInstance('target').getNode();

    // copy styles
    var i;
    for (i = 0; i < BORDER_STYLES.length; ++i) {
      this.getNode().style[BORDER_STYLES[i]] = SeamlessPosting.util.css(target, BORDER_STYLES[i]);
    }

    // copy inner styles
    var styles = {};
    for (i = 0; i < INHERIT_STYLES.length; ++i) {
      styles[INHERIT_STYLES[i]] = SeamlessPosting.util.css(target, INHERIT_STYLES[i]);
    }

    this.messageApp({
      action: 'posting/app/updateStyles',
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
      var res = SeamlessPosting.resource.getByNode('app', node);
      if (res === null) {
        return;
      }
      res.broadcastInternal({
        action: 'posting/internal/appBlurred'
      });
    }
  };

  App.addEventListeners = function () {
    document.addEventListener('DOMNodeRemoved', App.onDOMNodeRemoved, false);
  };

  App.addEventListeners();

  SeamlessPosting.App = App;

}());
