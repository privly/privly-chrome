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
        this.resource.getInstance('app').destroy();
      }
      var app = new Embeded.App(this.resource.getInstance('target'), Embeded.service.contextId, this.resource.id);
      this.resource.setInstance('app', app);
    } else if (this.resource.state === 'OPEN') {
      // at OPEN state: close
      this.resource.broadcastInternal({
        action: 'embeded/internal/closeRequested'
      });
    }
  };

  Embeded.Controller = Controller;

}());
