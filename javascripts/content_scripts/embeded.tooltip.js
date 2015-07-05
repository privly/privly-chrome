/*global chrome */
/*global Privly, Embeded */
// If Privly namespace is not initialized, initialize it
var Embeded;
if (Embeded === undefined) {
  Embeded = {};
}
(function () {

  var TOOLTIP_HEIGHT = 25;
  var TOOLTIP_MARGIN = 5;

  // If this file is already loaded, don't do it again
  if (Embeded.Tooltip !== undefined) {
    return;
  }

  var Tooltip = function () {
    this.addMessageListeners();
    this.createDOM();

    this.shown = false;
    this.isTooltipAbove = true;
    this.updateVisibility();
  };

  Tooltip.prototype = Object.create(Embeded.NodeResourceItem.prototype);
  Tooltip.prototype.super = Embeded.NodeResourceItem.prototype;

  /**
   * Create the DOM of the tooltip
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
    this.text = text;
    if (this.getNode()) {
      this.getNode().textContent = text;
    }
  };

  /**
   * Update the position of the tooltip, according
   * to the position of the button
   */
  Tooltip.prototype.reposition = function () {
    if (!this.isValid()) {
      this.hide();
      return;
    }
    if (!this.resource) {
      return;
    }
    if (!this.resource.getInstance('button')) {
      return;
    }
    var buttonNode = this.resource.getInstance('button').getNode();
    var region = buttonNode.getBoundingClientRect();

    var node = this.getNode();

    node.style.left = (region.left + (region.width - node.offsetWidth) / 2) + 'px';
    if (region.top - TOOLTIP_HEIGHT - TOOLTIP_MARGIN >= 0) {
      // show above the button
      node.style.top = (region.top - TOOLTIP_HEIGHT - TOOLTIP_MARGIN) + 'px';
      this.isTooltipAbove = true;
    } else {
      // show below the button
      node.style.top = (region.top + region.height + TOOLTIP_MARGIN) + 'px';
      this.isTooltipAbove = false;
    }
  };

  /**
   * Update the visibility of the tooltip according
   * to the `shown` property.
   */
  Tooltip.prototype.updateVisibility = function () {
    var node = this.getNode();
    if (this.shown) {
      node.style.opacity = 1;
      node.style.transform = 'none';
    } else {
      node.style.opacity = 0;
      if (this.isTooltipAbove) {
        node.style.transform = 'translateY(5px)';
      } else {
        node.style.transform = 'translateY(-5px)';
      }
    }
  };

  /**
   * Show the tooltip
   */
  Tooltip.prototype.show = function (text) {
    if (!this.resource) {
      return;
    }
    if (!this.resource.getInstance('button')) {
      return;
    }

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }

    // reset text content
    this.setText(text);

    // save a shortcut
    var node = this.getNode();

    // append DOM (if it was removed).
    // the DOM is appended to the `body`
    // to avoid possible overflow
    // cropping when appended to the
    // container of the editable element.
    document.body.appendChild(node);

    // update position
    this.reposition();

    // set initial animate property
    node.style.transition = 'none'; // remove transition
    node.offsetWidth;   // force relayout
    this.updateVisibility();  // reset animation to the hidden state
    node.offsetWidth;   // force relayout
    node.style.transition = 'transform .2s ease-in-out, opacity .2s ease-in-out'; // apply transition
    node.offsetWidth;   // force relayout

    // set to the shown state and play transition animation
    this.shown = true;
    this.updateVisibility();
  };

  /**
   * Check whether this resource item is in a valid state.
   * Our tooltip DOM is appended to the body only when user
   * hovers on the button, so here we override the default
   * `NodeResourceItem.isValid` function.
   * 
   * @override
   * @return {Boolean}
   */
  Tooltip.prototype.isValid = function () {
    if (this.shown) {
      if (!document.body.contains(this.getNode())) {
        return false;
      }
    }
    return true;
  };

  /**
   * Hide the tooltip
   */
  Tooltip.prototype.hide = function () {
    this.shown = false;
    this.updateVisibility();

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    // delay the removal a little,
    // to let the animation done
    this.hideTimer = setTimeout((function () {
      if (this.getNode().parentNode) {
        this.getNode().parentNode.removeChild(this.getNode());
      }
      this.hideTimer = null;
    }).bind(this), 200);
  };

  // Expose the interface
  Embeded.Tooltip = Tooltip;

}());
