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
   * when mouse move on to Privly posting button
   */
  Controller.prototype.onButtonMouseEntered = function () {
    if (this.resource.state === 'CLOSE') {
      this.resource.getInstance('tooltip').show('Click to enable Privly posting');
    }
  };

  /**
   * when mouse move out of Privly posting button
   */
  Controller.prototype.onButtonMouseLeft = function () {
    this.resource.getInstance('tooltip').hide();
  };

  /**
   * when target lose focus
   */
  Controller.prototype.onTargetDeactivated = function () {
    this.resource.getInstance('tooltip').hide();
  };

  Embeded.Controller = Controller;

}());
