/**
 * @fileOverview Floating is such kind of node resource that
 * floats above or below the Privly button. This class provides
 * a "template method" way to create such components.
 *
 * Tooltip and TTLSelect are based on this class.
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
  if (Embeded.Floating !== undefined) {
    return;
  }

  var Floating = function (margin) {
    this.addMessageListeners();

    /**
     * The margin between the floating node and the button
     * @type {Button}
     */
    this.margin = margin || 0;

    /**
     * Whether the floating node is visible
     * @type {Boolean}
     */
    this.isVisible = false;

    /**
     * Whether the floating node should show above the button
     * @type {Boolean}
     */
    this.showAbove = true;
  };

  Floating.prototype = Object.create(Embeded.NodeResourceItem.prototype);
  Floating.super = Embeded.NodeResourceItem.prototype;

  /**
   * Create the floating DOM node when this resource
   * item is attached to a resource
   * 
   * @override
   */
  Floating.prototype.attachResource = function (res) {
    Floating.super.attachResource.call(this, res);
    this.createDOM();
    this.updateVisibility();
  };

  /**
   * Destroy the floating DOM node when this resource
   * item is detached from a resource
   * 
   * @override
   */
  Floating.prototype.detachResource = function () {
    Floating.super.detachResource.call(this);
    // destroy timer
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    // remove node
    if (this.getNode() && this.getNode().parentNode) {
      this.getNode().parentNode.removeChild(this.getNode());
    }
    this.setNode(null);
  };

  /**
   * Create the content DOM of the floating node
   */
  Floating.prototype.createDOM = function () {
    throw new Error('Sub class should implement `createDOM`');
  };

  /**
   * Update the position of the floating node, according
   * to the position of the button
   */
  Floating.prototype.reposition = function () {
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
    if (region.top - node.offsetHeight - this.margin >= 0) {
      // show above the button
      node.style.top = (region.top - node.offsetHeight - this.margin) + 'px';
      this.showAbove = true;
    } else {
      // show below the button
      node.style.top = (region.top + region.height + this.margin) + 'px';
      this.showAbove = false;
    }
  };

  /**
   * Update the visibility of the floating node according
   * to the `isVisible` property.
   */
  Floating.prototype.updateVisibility = function () {
    var node = this.getNode();
    if (this.isVisible) {
      node.style.opacity = 1;
      node.style.transform = 'none';
    } else {
      node.style.opacity = 0;
      if (this.showAbove) {
        node.style.transform = 'translateY(5px)';
      } else {
        node.style.transform = 'translateY(-5px)';
      }
    }
  };

  /**
   * Show the floating node
   */
  Floating.prototype.show = function () {
    var self = this;
    if (!self.resource) {
      return;
    }
    if (!self.resource.getInstance('button')) {
      return;
    }
    if (self.hideTimer) {
      clearTimeout(self.hideTimer);
    }

    // append DOM (if it was removed).
    // the DOM is appended to the `body`
    // to avoid possible overflow
    // cropping when appended to the
    // container of the editable element.
    if (!document.body.contains(self.getNode())) {
      document.body.appendChild(self.getNode());
    }

    // set initial animate property
    self.resetAnimation();

    // update position
    self.reposition();

    // set to the isVisible state and play transition animation
    self.isVisible = true;
    self.updateVisibility();
  };

  /**
   * Reset the animation property to initial state
   */
  Floating.prototype.resetAnimation = function () {
    var node = this.getNode();
    node.style.transition = 'none'; // remove transition
    node.offsetWidth;   // force relayout
    this.updateVisibility();  // reset animation to the hidden state
    node.offsetWidth;   // force relayout
    node.style.transition = 'transform .2s ease-in-out, opacity .2s ease-in-out'; // apply transition
    node.offsetWidth;   // force relayout
  };

  /**
   * Check whether this resource item is in a valid state.
   * Our floating DOM node is appended to the body only when
   * user hovers on the button, so here we override the default
   * `NodeResourceItem.isValid` function.
   * 
   * @override
   * @return {Boolean}
   */
  Floating.prototype.isValid = function () {
    if (this.isVisible) {
      if (!document.body.contains(this.getNode())) {
        return false;
      }
    }
    return true;
  };

  /**
   * Hide the floating node
   */
  Floating.prototype.hide = function () {
    if (!this.isVisible) {
      return;
    }
    this.isVisible = false;
    this.updateVisibility();

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    // delay the DOM removal a little,
    // to let the animation done
    this.hideTimer = setTimeout((function () {
      if (this.getNode().parentNode) {
        this.getNode().parentNode.removeChild(this.getNode());
      }
      this.hideTimer = null;
    }).bind(this), 200);
  };

  // Expose the interface
  Embeded.FloatingResourceItem = Floating;

}());
