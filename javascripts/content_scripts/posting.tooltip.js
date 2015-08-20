/**
 * @fileOverview Tooltip is the hint text shown below the Privly
 * button when user hovers on it, telling the user that by clicking
 * the button he/she can enter seamless-posting mode.
 */
/*global chrome */
/*global Privly, SeamlessPosting */
// If Privly namespace is not initialized, initialize it
var SeamlessPosting;
if (SeamlessPosting === undefined) {
  SeamlessPosting = {};
}
(function () {

  var TOOLTIP_MARGIN = 5;

  // If this file is already loaded, don't do it again
  if (SeamlessPosting.Tooltip !== undefined) {
    return;
  }

  /**
   * @implements SeamlessPosting.FloatingResourceItem
   */
  var Tooltip = function () {
    SeamlessPosting.FloatingResourceItem.call(this, TOOLTIP_MARGIN);
  };

  Tooltip.prototype = Object.create(SeamlessPosting.FloatingResourceItem.prototype);
  Tooltip.super = SeamlessPosting.FloatingResourceItem.prototype;

  /**
   * Create the DOM of the tooltip
   *
   * @override
   */
  Tooltip.prototype.createDOM = function () {
    var node = document.createElement('div');
    node.style.padding = '5px';
    node.style.background = 'rgba(0, 0, 0, 0.7)';
    node.style.color = '#FFF';
    node.style.fontSize = '12px';
    node.style.lineHeight = '15px';
    node.style.position = 'fixed';
    node.style.fontFamily = 'Seravek, Segoe UI, Verdana, Arial';
    node.style.whiteSpace = 'nowrap';
    node.style.zIndex = 2147483642;

    this.setNode(node);
  };

  /**
   * Set the text of the tooltip DOM
   */
  Tooltip.prototype.setText = function (text) {
    if (this.getNode()) {
      this.getNode().textContent = text;
    }
  };

  /**
   * Set the text and show the tooltip
   *
   * @override
   */
  Tooltip.prototype.show = function (text) {
    this.setText(text);
    Tooltip.super.show.call(this);
  };

  // Expose the interface
  SeamlessPosting.Tooltip = Tooltip;

}());
