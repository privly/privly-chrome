/**
 * @fileOverview Control the embeded-posting form:
 * respond to the click of the Privly button.
 *
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    embeded/internal/closeRequested
 *        when user clicks the CLOSE privly button
 *        to request closing the embeded-posting app
 */
/*global Embeded */
/*global Privly */
// If Privly namespace is not initialized, initialize it
var Embeded;
if (Embeded === undefined) {
  Embeded = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (Embeded.Controller !== undefined) {
    return;
  }

  /**
   * @class
   * @arguments ResourceItem
   */
  var Controller = function () {
    this.addMessageListeners();

    /**
     * Whether the mouse has entered the Privly button
     * @type {Boolean}
     */
    this.buttonMouseEnter = false;

    /**
     * Whether the tooltip is visible
     * @type {Boolean}
     */
    this.tooltipVisible = false;

    /**
     * Whether the TTL select is visible
     * @type {Boolean}
     */
    this.selectVisible = false;
  };

  Controller.prototype = Object.create(Embeded.ResourceItem.prototype);
  Controller.prototype.super = Embeded.ResourceItem.prototype;

  /**
   * Add message listeners
   */
  Controller.prototype.addMessageListeners = function () {
    this.addMessageListener('embeded/internal/buttonClicked', this.onButtonClicked.bind(this));
    this.addMessageListener('embeded/internal/buttonMouseEntered', this.onButtonMouseEntered.bind(this));
    this.addMessageListener('embeded/internal/buttonMouseLeft', this.onButtonMouseLeft.bind(this));
    this.addMessageListener('embeded/internal/targetDeactivated', this.onTargetDeactivated.bind(this));
    this.addMessageListener('embeded/internal/TTLSelectMouseEntered', this.onTTLSelectMouseEntered.bind(this));
    this.addMessageListener('embeded/internal/TTLSelectMouseLeft', this.onTTLSelectMouseLeft.bind(this));
    this.addMessageListener('embeded/contentScript/TTLChanged', this.onTTLChanged.bind(this));
    this.addMessageListener('embeded/contentScript/appStarted', this.onAppStarted.bind(this));
    this.addMessageListener('embeded/contentScript/appClosed', this.onAppClosed.bind(this));
  };

  /**
   * when Privly posting button is clicked
   */
  Controller.prototype.onButtonClicked = function () {
    // only available when this controller is attached to a resource
    if (!this.resource) {
      return;
    }
    if (this.resource.state === 'CLOSE') {
      // at CLOSE state: open
      // when click the Privly button to open: create a new embeded-app and tell the app
      if (this.resource.getInstance('app')) {
        this.resource.getInstance('app').createDOM();
      } else {
        var app = new Embeded.App();
        this.resource.setInstance('app', app);
      }
    } else if (this.resource.state === 'OPEN') {
      // at OPEN state: close
      this.resource.broadcastInternal({
        action: 'embeded/internal/closeRequested'
      });
    }
  };

  /**
   * Show the TTLSelect
   */
  Controller.prototype.showTTLSelect = function () {
    if (this.selectTimer) {
      clearTimeout(this.selectTimer);
      this.selectTimer = false;
    }
    if (this.selectVisible) {
      return;
    }
    this.selectVisible = true;
    this.resource.getInstance('ttlselect').show(this.resource.ttl);
  };

  /**
   * Hide the TTLSelect
   */
  Controller.prototype.hideTTLSelect = function (immediate) {
    if (!this.selectVisible) {
      return;
    }
    if (immediate === true) {
      this.selectVisible = false;
      this.resource.getInstance('ttlselect').hide();
    } else {
      this.selectTimer = setTimeout((function () {
        this.hideTTLSelect(true);
        this.selectTimer = null;
      }).bind(this), 100);
    }
  };

  /**
   * Show the tooltip
   */
  Controller.prototype.showTooltip = function () {
    if (this.tooltipVisible) {
      return;
    }
    this.tooltipVisible = true;
    this.resource.getInstance('tooltip').show('Click to enable Privly posting');
  };

  /**
   * Hide the tooltip
   */
  Controller.prototype.hideTooltip = function () {
    if (!this.tooltipVisible) {
      return;
    }
    this.tooltipVisible = false;
    this.resource.getInstance('tooltip').hide();
  };

  /**
   * when mouse move on to Privly posting button
   */
  Controller.prototype.onButtonMouseEntered = function () {
    this.buttonMouseEnter = true;
    if (this.resource.state === 'CLOSE') {
      this.showTooltip();
    } else if (this.resource.state === 'OPEN') {
      this.showTTLSelect();
    }
  };

  /**
   * when mouse move out of Privly posting button
   */
  Controller.prototype.onButtonMouseLeft = function () {
    this.buttonMouseEnter = false;
    this.hideTooltip();
    this.hideTTLSelect();
  };

  /**
   * when target lose focus
   */
  Controller.prototype.onTargetDeactivated = function () {
    this.buttonMouseEnter = false;
    this.hideTooltip();
    this.hideTTLSelect(true);
  };

  /**
   * when mouse enter TTLSelect
   */
  Controller.prototype.onTTLSelectMouseEntered = function () {
    if (this.resource.state !== 'OPEN') {
      return;
    }
    this.showTTLSelect();
  };

  /**
   * when mouse left TTLSelect
   */
  Controller.prototype.onTTLSelectMouseLeft = function () {
    this.hideTTLSelect();
  };

  /**
   * when user clicks the TTLSelect
   */
  Controller.prototype.onTTLChanged = function (message) {
    this.resource.ttl = message.value;
    this.hideTTLSelect(true);
  };

  /**
   * when Embeded-posting app is started
   */
  Controller.prototype.onAppStarted = function () {
    this.hideTooltip();
    // if the mouse is over the button then show the TTLSelect
    if (this.buttonMouseEnter) {
      this.showTTLSelect();
    }
  };

  /**
   * when Embeded-posting app is closed
   */
  Controller.prototype.onAppClosed = function () {
    this.hideTTLSelect(true);
    if (this.buttonMouseEnter) {
      this.showTooltip();
    }
  };

  Embeded.Controller = Controller;

}());
