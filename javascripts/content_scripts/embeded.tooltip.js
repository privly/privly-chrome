/*global chrome */
/*global Privly, Embeded */
// If Privly namespace is not initialized, initialize it
var Embeded;
if (Embeded === undefined) {
  Embeded = {};
}
(function () {

  var TOOLTIP_MARGIN = 5;

  // If this file is already loaded, don't do it again
  if (Embeded.Tooltip !== undefined) {
    return;
  }

  /**
   * @implements Embeded.FloatingResourceItem
   */
  var Tooltip = function () {
    Embeded.FloatingResourceItem.call(this, TOOLTIP_MARGIN);
  };

  Tooltip.prototype = Object.create(Embeded.FloatingResourceItem.prototype);
  Tooltip.super = Embeded.FloatingResourceItem.prototype;

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
  Embeded.Tooltip = Tooltip;

}());
