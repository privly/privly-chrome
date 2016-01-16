/**
 * @fileOverview This file handles all stuff related to
 * the Privly posting button. Privly posting button
 * is a clickable button, which will appear when user
 * focusing an editable element. If the user clicks it,
 * user will start seamless-posting mode and the button
 * becomes an "X" for exiting the mode.
 *
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    posting/internal/buttonMouseEntered
 *        when user moved on to a button
 *
 *    posting/internal/buttonMouseLeft
 *        when user moved out of a button
 *
 *    posting/internal/buttonClicked
 *        when user clicked the button
 *
 *    posting/internal/buttonStateChanged
 *        when button state has changed (open -> loading, etc)
 */
/*global chrome */
/*global window, SeamlessPosting, Privly */
'use strict';
// If Privly namespace is not initialized, initialize it
var SeamlessPosting;
if (SeamlessPosting === undefined) {
  SeamlessPosting = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (SeamlessPosting.Button !== undefined) {
    return;
  }

  var BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_MARGIN, INACTIVE_HIDE, BLUR_HIDE, SVG_OPEN, SVG_CLOSE, SVG_LOADING;
  BUTTON_WIDTH = 20;
  BUTTON_HEIGHT = 20;
  BUTTON_MARGIN = 2;
  INACTIVE_HIDE = 5000; // fade out after 5000 ms
  BLUR_HIDE = 100; // fade out after 100 ms when lose focus

  SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="#444" d="M8 6h3v2l4-3-4-3v2H7c-.6 0-1 .4-1 1v6H4v7h12v-7H8V6z"/></svg>';
  SVG_CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="#444" d="M14 15.4l-4-4-4 4L4.6 14l4-4-4-4L6 4.6l4 4 4-4L15.4 6l-4 4 4 4"/></svg>';
  SVG_LOADING = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50"><path fill="#444" d="M43.94 25.15c0-10.32-8.36-18.68-18.68-18.68S6.58 14.84 6.58 25.15h4.07c0-8.07 6.54-14.61 14.62-14.61 8.07 0 14.62 6.54 14.62 14.62h4.05z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1" repeatCount="indefinite"/></path></svg>';

  /**
   * A pre-defined table of the button property
   * for each state
   */
  var INTERNAL_STATE_PROPERTY = {
    CLOSE: {
      autohide: true,
      clickable: true,
      tooltip: true,
      icon: SVG_OPEN
    },
    OPEN: {
      autohide: false,
      clickable: true,
      tooltip: false,
      icon: SVG_CLOSE
    },
    LOADING: {
      autohide: false,
      clickable: false,
      tooltip: false,
      icon: SVG_LOADING
    }
  };

  /**
   * Handling all of the Privly button stuff
   * 
   * @class
   * @arguments NodeResourceItem
   */
  var Button = function () {
    this.addMessageListeners();

    var button = document.createElement('div');
    this.setNode(button);

    button.style.cursor = 'pointer';
    button.style.zIndex = 2147483641;
    button.style.transition = 'opacity .15s ease-in-out, transform .15s ease-in-out';
    button.style.width = String(BUTTON_WIDTH) + 'px';
    button.style.height = String(BUTTON_HEIGHT) + 'px';

    button.setAttribute('data-privly-exclude', 'true');
    button.setAttribute('data-privly-role', 'button');

    button.addEventListener('mousedown', this.onMouseDown.bind(this));
    button.addEventListener('click', this.onClick.bind(this));
    button.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    button.addEventListener('mouseleave', this.onMouseLeave.bind(this));

    this.state = 'CLOSE';
    this.isLoading = false;
    this.isVisible = false;
    this.updateInternalState();
    this.updateVisibility();
  };

  Button.prototype = Object.create(SeamlessPosting.NodeResourceItem.prototype);
  Button.super = SeamlessPosting.NodeResourceItem.prototype;

  /**
   * Button DOM onMouseDown event handler
   * ev.preventDefault() is used to prevent
   * the button from getting focus. Thus
   * the focus element won't change.
   * 
   * @param  {Event} ev
   */
  Button.prototype.onMouseDown = function (ev) {
    ev.preventDefault();
  };

  /**
   * Button DOM onMouseEnter event handler
   */
  Button.prototype.onMouseEnter = function () {
    this.show();
    if (this.resource) {
      this.resource.broadcastInternal({
        action: 'posting/internal/buttonMouseEntered'
      });
    }
  };

  /**
   * Button DOM onMouseLeave event handler
   */
  Button.prototype.onMouseLeave = function () {
    this.postponeHide();
    if (this.resource) {
      this.resource.broadcastInternal({
        action: 'posting/internal/buttonMouseLeft'
      });
    }
  };

  /**
   * Button DOM onClick event handler
   */
  Button.prototype.onClick = function () {
    // return if the button is not clickable
    if (!INTERNAL_STATE_PROPERTY[this.internalState].clickable) {
      return;
    }
    if (this.resource) {
      this.resource.broadcastInternal({
        action: 'posting/internal/buttonClicked'
      });
    }
  };

  /**
   * add message listeners
   */
  Button.prototype.addMessageListeners = function () {
    Button.super.addMessageListeners.call(this);
    this.addMessageListener('posting/internal/targetActivated', this.onTargetActivated.bind(this));
    this.addMessageListener('posting/internal/targetDeactivated', this.onTargetDeactivated.bind(this));
    this.addMessageListener('posting/internal/targetPositionChanged', this.onTargetPositionChanged.bind(this));
    this.addMessageListener('posting/internal/stateChanged', this.onStateChanged.bind(this));
    this.addMessageListener('posting/contentScript/loading', this.onSetLoading.bind(this));
  };

  /**
   * on target element position or size has changed
   */
  Button.prototype.onTargetPositionChanged = function () {
    this.updatePosition();
  };

  /**
   * on target element activated
   */
  Button.prototype.onTargetActivated = function () {
    this.updatePosition();
    this.show();
    this.postponeHide();
  };

  /**
   * on target element deactivated
   */
  Button.prototype.onTargetDeactivated = function () {
    this.postponeHide(BLUR_HIDE);
  };

  /**
   * on set loading / not loading
   * @param  {String} message
   */
  Button.prototype.onSetLoading = function (message) {
    this.isLoading = message.state;
    this.updateInternalState();
  };

  /**
   * on resource state changed
   * 
   * @param  {String} message
   */
  Button.prototype.onStateChanged = function (message) {
    this.state = message.state;
    this.updateInternalState();
  };

  /**
   * When this button instance is attached to a resource
   * 
   * @override
   */
  Button.prototype.attachResource = function (res) {
    if (!res.getInstance('target')) {
      throw new Error('Expect target instance in the resource');
    }
    res.getInstance('target').getNode().parentNode.appendChild(this.getNode());
    Button.super.attachResource.call(this, res);
    this.state = res.state;
    this.updateInternalState();
  };

  /**
   * When this button instance is detached from a resource
   *
   * @override
   */
  Button.prototype.detachResource = function () {
    Button.super.detachResource.call(this);
    if (this.getNode().parentNode) {
      this.getNode().parentNode.removeChild(this.getNode());
    }
  };

  /**
   * Update the button internal state and behaviours
   * according to the loading state and resource state
   */
  Button.prototype.updateInternalState = function () {
    var oldState = this.internalState;

    if (this.isLoading) {
      this.internalState = 'LOADING';
    } else {
      this.internalState = this.state;
    }

    this.getNode().innerHTML = INTERNAL_STATE_PROPERTY[this.internalState].icon;

    if (INTERNAL_STATE_PROPERTY[this.internalState].clickable) {
      this.getNode().style.cursor = 'pointer';
    } else {
      this.getNode().style.cursor = 'default';
    }

    this.updateVisibility();

    if (oldState !== this.internalState && this.resource) {
      this.resource.broadcastInternal({
        action: 'posting/internal/buttonStateChanged',
        showTooltip: INTERNAL_STATE_PROPERTY[this.internalState].tooltip
      });
    }
  };

  /**
   * Show the button
   */
  Button.prototype.show = function () {
    this.cancelPostponeHide();
    this.isVisible = true;
    this.updateVisibility();
  };

  /**
   * Hide the button after some seconds
   * @param  {Number} delay Hide delay in ms
   */
  Button.prototype.postponeHide = function (delay) {
    var self = this;
    // cancel existing postpone hide process
    if (self.timerHide) {
      self.cancelPostponeHide();
    }
    self.timerHide = setTimeout(function () {
      self.hide();
      self.timerHide = null;
    }, delay || INACTIVE_HIDE);
  };

  /**
   * Cancel postponed hiding
   */
  Button.prototype.cancelPostponeHide = function () {
    if (this.timerHide !== undefined) {
      clearTimeout(this.timerHide);
      this.timerHide = null;
    }
  };

  /**
   * Fade out button and make button unclickable
   */
  Button.prototype.hide = function () {
    this.cancelPostponeHide();
    this.isVisible = false;
    this.updateVisibility();
  };

  /**
   * Update the visibility of the button according to the internal state
   */
  Button.prototype.updateVisibility = function () {
    var node = this.getNode();
    if (this.isVisible || !INTERNAL_STATE_PROPERTY[this.internalState].autohide) {
      node.style.opacity = 0.7;
      node.style.transform = 'none';
      node.style.pointerEvents = 'auto';
    } else {
      node.style.opacity = 0;
      node.style.transform = 'scale(0.7)';
      node.style.pointerEvents = 'none';
    }
  };

  /**
   * Update the position of the button according to the target element
   */
  Button.prototype.updatePosition = function () {
    if (!this.resource) {
      return;
    }
    if (!this.resource.getInstance('target')) {
      return;
    }
    var target, box, targetRTPos, hMargin, vMargin;
    target = this.resource.getInstance('target').getNode();

    // we do not use offsetWidth and offsetHeight here, since it
    // will give us incorrect bounding box for wrapped inline elements.
    box = target.getClientRects()[0];
    targetRTPos = SeamlessPosting.util.position(target);
    targetRTPos.top += SeamlessPosting.util.css(target, 'marginTop', true);
    targetRTPos.top += SeamlessPosting.util.css(target, 'borderTopWidth', true);
    targetRTPos.left += SeamlessPosting.util.css(target, 'marginLeft', true);
    targetRTPos.left += SeamlessPosting.util.css(target, 'borderLeftWidth', true);
    targetRTPos.left += box.width;
    targetRTPos.left -= SeamlessPosting.util.css(target, 'borderLeftWidth', true);
    targetRTPos.left -= SeamlessPosting.util.css(target, 'borderRightWidth', true);

    // calculate proper margins
    hMargin = BUTTON_MARGIN;
    if (box.width < (BUTTON_WIDTH + BUTTON_MARGIN * 2)) {
      hMargin = Math.floor((box.width - BUTTON_WIDTH) / 2);
    }
    vMargin = BUTTON_MARGIN;
    if (box.height < (BUTTON_HEIGHT + BUTTON_MARGIN * 2)) {
      vMargin = Math.floor((box.height - BUTTON_HEIGHT) / 2);
    }

    // set position of the button
    this.getNode().style.position = (target.nodeName !== 'BODY') ? 'absolute' : 'fixed';
    this.getNode().style.left = String(targetRTPos.left - hMargin - BUTTON_WIDTH) + 'px';
    this.getNode().style.top = String(targetRTPos.top + vMargin) + 'px';
  };

  SeamlessPosting.Button = Button;

}());