/*global chrome */
/*global window, Embeded, Privly */
// If Privly namespace is not initialized, initialize it
var Embeded;
if (Embeded === undefined) {
  Embeded = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (Embeded.Button !== undefined) {
    return;
  }

  var BUTTON_WIDTH = 20;
  var BUTTON_HEIGHT = 20;
  var BUTTON_MARGIN = 2;
  var INACTIVE_HIDE = 5000; // fade out after 5000 ms
  var BLUR_HIDE = 100;      // fade out after 100 ms when lose focus

  var SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="#444" d="M8 6h3v2l4-3-4-3v2H7c-.6 0-1 .4-1 1v6H4v7h12v-7H8V6z"/></svg>';
  var SVG_CLOSE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path fill="#444" d="M14 15.4l-4-4-4 4L4.6 14l4-4-4-4L6 4.6l4 4 4-4L15.4 6l-4 4 4 4"/></svg>';
  var SVG_LOADING = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 50 50"><path fill="#444" d="M43.94 25.15c0-10.32-8.36-18.68-18.68-18.68S6.58 14.84 6.58 25.15h4.07c0-8.07 6.54-14.61 14.62-14.61 8.07 0 14.62 6.54 14.62 14.62h4.05z"><animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1" repeatCount="indefinite"/></path></svg>';

  var INTERNAL_STATE_PROPERTY = {
    CLOSE: {
      autohide: true,
      clickable: true,
      icon: SVG_OPEN
    },
    OPEN: {
      autohide: false,
      clickable: true,
      icon: SVG_CLOSE
    },
    LOADING: {
      autohide: false,
      clickable: false,
      icon: SVG_LOADING
    }
  };

  var Button = function (target) {
    var button = document.createElement('div');
    this.setNode(button);

    button.style.position = (target.getNode().nodeName !== 'BODY') ? 'absolute' : 'fixed';
    button.style.cursor = 'pointer';
    button.style.zIndex = 2147483641;
    button.style.opacity = 0;
    button.style.transition = 'opacity 0.1s linear';
    button.style.width = String(BUTTON_WIDTH) + 'px';
    button.style.height = String(BUTTON_HEIGHT) + 'px';
    button.title = 'New Privly message';

    button.setAttribute('data-privly-exclude', 'true');

    button.addEventListener('mousedown', Button.onMouseDown);
    button.addEventListener('click', Button.onClick);
    button.addEventListener('mouseover', Button.onMouseOver);
    button.addEventListener('mouseout', Button.onMouseOut);

    target.getNode().parentNode.appendChild(button);

    this.isVisible = false;
  };

  Button.prototype = Object.create(Embeded.NodeResourceItem.prototype);
  Button.prototype.super = Embeded.NodeResourceItem.prototype;

  Button.prototype.onMessage = function (message, sendResponse) {
    var self = this;
    switch (message.action) {
    case 'embeded/contentScript/loading':
      self.setLoading(message.state);
      break;
    }
  };

  /**
   * Button DOM onMouseDown event handler
   * ev.preventDefault() is used to prevent
   * the button from getting focus. Thus
   * the focus element won't change.
   * 
   * @param  {Event} ev
   */
  Button.onMouseDown = function (ev) {
    ev.preventDefault();
  };

  Button.onMouseOver = function () {
    var res = Embeded.resource.getByNode('button', this);
    if (res === null) {
      return;
    }
    var button = res.getInstance('button');
    button.show();
    Embeded.util.dispatchPrivlyEvent(this, 'PrivlyButtonMouseOver');
  };

  Button.onMouseOut = function () {
    var res = Embeded.resource.getByNode('button', this);
    if (res === null) {
      return;
    }
    var button = res.getInstance('button');
    button.postponeHide();
    Embeded.util.dispatchPrivlyEvent(this, 'PrivlyButtonMouseOut');
  };

  Button.onClick = function () {
    var res = Embeded.resource.getByNode('button', this);
    if (res === null) {
      return;
    }
    var button = res.getInstance('button');
    if (!INTERNAL_STATE_PROPERTY[button.internalState].clickable) {
      return;
    }
    Embeded.util.dispatchPrivlyEvent(this, 'PrivlyButtonClick');
  };

  Button.onTargetActivated = function (ev) {
    var res = Embeded.resource.getByNode('target', ev.target);
    if (res === null) {
      return;
    }
    var button = res.getInstance('button');
    if (button === null) {
      return;
    }
    button.updatePosition();
    button.show();
    button.postponeHide();
  };

  Button.onTargetDeactivated = function (ev) {
    var res = Embeded.resource.getByNode('target', ev.target);
    if (res === null) {
      return;
    }
    var button = res.getInstance('button');
    if (button === null) {
      return;
    }
    button.postponeHide(BLUR_HIDE);
  };

  Button.addListeners = function () {
    document.addEventListener('PrivlyTargetActivated', Button.onTargetActivated, false);
    document.addEventListener('PrivlyTargetDeactivated', Button.onTargetDeactivated, false);
  };

  /**
   * @override
   */
  Button.prototype.attachResource = function (res) {
    this.super.attachResource.call(this, res);
    this.setState(res.getState());
  };

  Button.prototype.updateInternalState = function () {
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
  };

  Button.prototype.setLoading = function (loading) {
    this.isLoading = loading;
    this.updateInternalState();
  };

  Button.prototype.setState = function (state) {
    this.state = state;
    this.updateInternalState();
  };

  Button.prototype.show = function () {
    this.cancelPostponeHide();
    this.isVisible = true;
    this.updateVisibility();
  };

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

  Button.prototype.updateVisibility = function () {
    if (this.isVisible || !INTERNAL_STATE_PROPERTY[this.internalState].autohide) {
      this.getNode().style.opacity = 0.7;
      this.getNode().style.pointerEvents = 'auto';
    } else {
      this.getNode().style.opacity = 0;
      this.getNode().style.pointerEvents = 'none';
    }
  };

  Button.prototype.updatePosition = function () {
    var target = this.resource.getInstance('target').getNode();

    // we do not use offsetWidth and offsetHeight here, since it
    // will give us incorrect bounding box for wrapped inline elements.
    var box = target.getClientRects()[0];
    var targetRTPos = Embeded.util.position(target);
    targetRTPos.top += Embeded.util.css(target, 'marginTop', true);
    targetRTPos.top += Embeded.util.css(target, 'borderTopWidth', true);
    targetRTPos.left += Embeded.util.css(target, 'marginLeft', true);
    targetRTPos.left += Embeded.util.css(target, 'borderLeftWidth', true);
    targetRTPos.left += box.width;
    targetRTPos.left -= Embeded.util.css(target, 'borderLeftWidth', true);
    targetRTPos.left -= Embeded.util.css(target, 'borderRightWidth', true);

    // calculate proper margins
    var hMargin = BUTTON_MARGIN;
    if (box.width < (BUTTON_WIDTH + BUTTON_MARGIN * 2)) {
      hMargin = Math.floor((box.width - BUTTON_WIDTH) / 2);
    }
    var vMargin = BUTTON_MARGIN;
    if (box.height < (BUTTON_HEIGHT + BUTTON_MARGIN * 2)) {
      vMargin = Math.floor((box.height - BUTTON_HEIGHT) / 2);
    }

    // set position of the button
    this.getNode().style.left = String(targetRTPos.left - hMargin - BUTTON_WIDTH) + 'px';
    this.getNode().style.top = String(targetRTPos.top + vMargin) + 'px';
  };

  Button.addListeners();

  Embeded.Button = Button;

}());
