/**
 * @fileOverview 
 * 
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    embeded/internal/TTLSelectMouseEntered
 *        when mouse entered the TTLSelect
 *
 *    embeded/internal/TTLSelectMouseLeft
 *        when mouse left the TTLSelect
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
  if (Embeded.TTLSelect !== undefined) {
    return;
  }

  /**
   * Margin between the select and the Privly button
   * 
   * @type {Number}
   */
  var SELECT_MARGIN = 0;

  /**
   * @implements Embeded.FloatingResourceItem
   */
  var TTLSelect = function () {
    Embeded.FloatingResourceItem.call(this, SELECT_MARGIN);
  };

  TTLSelect.prototype = Object.create(Embeded.FloatingResourceItem.prototype);
  TTLSelect.super = Embeded.FloatingResourceItem.prototype;

  /**
   * Add message listeners
   */
  TTLSelect.prototype.addMessageListeners = function () {
    TTLSelect.super.addMessageListeners.call(this);
    this.addMessageListener('embeded/contentScript/TTLSelectReady', this.onTTLSelectReady.bind(this));
  };

  /**
   * when TTLSelect iframe is loaded
   */
  TTLSelect.prototype.onTTLSelectReady = function (message) {
    if (typeof this.TTLReadyCallback === 'function') {
      this.TTLReadyCallback(message.size);
    }
  };

  /**
   * Send message to the TTLSelect iframe app. Those messages
   * are forwarded by the background script
   * 
   * @param  {Object} message
   * @param  {Boolean} hasResponse  Does this message expected to
   *                                receive a response?
   * @return {Promise}
   */
  TTLSelect.prototype.messageApp = function (message, hasResponse) {
    var messageToSend = JSON.parse(JSON.stringify(message));
    messageToSend.targetAppId = this.appId;
    messageToSend.hasResponse = hasResponse;
    return Privly.message.messageExtension(messageToSend);
  };

  /**
   * Assign the app id when it is attached to a resource
   * 
   * @override
   */
  TTLSelect.prototype.attachResource = function (res) {
    /**
     * A unique id to identify the app
     * @type {String}
     */
    this.appId = 'embeded.ttl.' + Embeded.service.contextId + res.id;

    TTLSelect.super.attachResource.call(this, res);
  };

  /**
   * Create the DOM of the time-to-live select
   *
   * @override
   */
  TTLSelect.prototype.createDOM = function () {
    // create an iframe to render the select menu
    // to prevent host script performing action on it
    // (emulating click or tampering)
    var node = document.createElement('iframe');
    var attrs = {
      'frameborder': '0',
      'scrolling': 'no',
      'data-privly-exclude': 'true',
      'allowtransparency': 'true',
      // by telling the application our context id, the app can send message
      // back to us without using host-page message channel (postMessage).
      'src': chrome.extension.getURL('privly-applications/Message/embeded_ttlselect.html' +
          '?contextid=' + encodeURIComponent(Embeded.service.contextId) +
          '&resid=' + encodeURIComponent(this.resource.id) +
          '&appid=' + encodeURIComponent(this.appId)
        )
    };
    var key;
    for (key in attrs) {
      node.setAttribute(key, attrs[key]);
    }
    node.style.position = 'fixed';
    node.style.zIndex = 2147483643;

    node.addEventListener('mouseenter', this.onIFrameMouseEnter.bind(this));
    node.addEventListener('mouseleave', this.onIFrameMouseLeave.bind(this));

    this.setNode(node);
  };

  /**
   * when mouse enter the TTL select
   */
  TTLSelect.prototype.onIFrameMouseEnter = function () {
    if (this.resource) {
      this.resource.broadcastInternal({
        action: 'embeded/internal/TTLSelectMouseEntered'
      });
    }
  };

  /**
   * when mouse left the TTL select
   */
  TTLSelect.prototype.onIFrameMouseLeave = function () {
    if (this.resource) {
      this.resource.broadcastInternal({
        action: 'embeded/internal/TTLSelectMouseLeft'
      });
    }
  };

  /**
   * We need to determine whether node DOM is re-added
   * in `show`, so we override this function.
   *
   * If the DOM node is re-added (hover in after the out
   * animation completes), we need to wait iframe ready.
   *
   * Else (hover before the out animation completes), we
   * just message it to reset content.
   *
   * @override
   */
  TTLSelect.prototype.show = function (selectedValue) {
    var self = this;
    if (self.isVisible) {
      return;
    }
    if (!self.resource) {
      return;
    }
    if (!self.resource.getInstance('button')) {
      return;
    }
    if (self.hideTimer) {
      clearTimeout(self.hideTimer);
    }

    self.resetAnimation();
    self.isVisible = true;

    // wait until the iframe is ready
    new Promise(function (resolve) {
      if (!document.body.contains(self.getNode())) {
        self.TTLReadyCallback = function (size) {
          self.getNode().style.width = size.width + 'px';
          self.getNode().style.height = size.height + 'px';
          self.TTLReadyCallback = null;
          resolve();
        };
        document.body.appendChild(self.getNode());
      } else {
        resolve();
      }
    }).then(function () {
      // update position
      self.reposition();
      return new Promise(function (resolve, reject) {
        // user hovers out
        if (!self.isVisible) {
          return reject();
        }
        // tell the iframe to initialize the menu
        self.messageApp({
          action: 'embeded/app/initializeTTLSelect',
          isAbove: self.showAbove,
          selectedTTL: selectedValue
        }).then(function () {
          // user hovers out
          if (!self.isVisible) {
            return reject();
          }
          resolve();
        });
      });
    }).then(function () {
      // menu has initialized..
      // self.isVisible should be true
      self.updateVisibility();
    }, function () {
      // do nothing when rejected
    });
  };


  // Expose the interface
  Embeded.TTLSelect = TTLSelect;

}());
