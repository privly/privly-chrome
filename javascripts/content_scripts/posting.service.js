/**
 * @fileOverview Handle the creation and control
 * of the resource object, which is associated to
 * the target element.
 *
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    posting/internal/targetActivated
 *        when the target element is activated (got
 *        focus or clicked)
 *
 *    posting/internal/targetDeactivated
 *        when the target element is deactivated
 *        (lost focus)
 */
/*global SeamlessPosting, Privly */
/*global chrome */
// If Privly namespace is not initialized, initialize it
var SeamlessPosting;
if (SeamlessPosting === undefined) {
  SeamlessPosting = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (SeamlessPosting.service !== undefined) {
    return;
  }

  /**
   * Deal with the target element, to create associated
   * Target resource item and send events
   * 
   * @type {Object}
   */
  var service = {
    /**
     * Whether seamless-posting button is enabled
     * 
     * @type {Boolean}
     */
    enabled: false,

    /**
     * A unique id for the current content context
     * 
     * @type {String}
     */
    contextId: Math.floor(Math.random() * 0xFFFFFFFF).toString(16) + Date.now().toString(16),

    /**
     * The DOM node of the last right click, used
     * to identify the target when user clicks a
     * context menu item.
     * 
     * @type {Node}
     */
    lastRightClientTarget: null
  };

  /**
   * Create a resource object for the specified target node.
   * `SeamlessPosting.Target` and `SeamlessPosting.Button`
   * instance will be created and attached to the newly
   * created resource object.
   * 
   * The resource object will be added to the global resource pool,
   * for being referenced in other modules.
   * 
   * @param  {Element} targetNode The editable element
   * @return {SeamlessPosting.Resource}
   */
  service.createResource = function (targetNode) {
    var res = new SeamlessPosting.Resource();
    var controllerInstance = new SeamlessPosting.Controller();
    var targetInstance = new SeamlessPosting.Target(targetNode);
    var buttonInstance = new SeamlessPosting.Button();
    var tooltipInstance = new SeamlessPosting.Tooltip();
    var ttlSelectInstance = new SeamlessPosting.TTLSelect();
    res.setInstance('controller', controllerInstance);
    res.setInstance('target', targetInstance);
    res.setInstance('button', buttonInstance);
    res.setInstance('tooltip', tooltipInstance);
    res.setInstance('ttlselect', ttlSelectInstance);
    res.attach();
    return res;
  };

  /**
   * Event listener callback, being called when the context menu
   * of the target is clicked
   * 
   * @param  {Element} target
   * @param  {String} app The app user selected to use
   */
  service.onContextMenuClicked = function (target, app) {
    if (!SeamlessPosting.util.isElementEditable(target)) {
      return;
    }
    target = SeamlessPosting.util.getOutMostTarget(target);
    if (target === null) {
      return;
    }
    var res = SeamlessPosting.resource.getByNode('target', target);
    res.broadcastInternal({
      action: 'posting/internal/contextMenuClicked',
      app: app
    });
  };

  /**
   * Event listener callback, being called when the target element
   * is activated, for example, by clicking or focusing.
   * 
   * @param  {Event} ev
   */
  service.onActivated = function (ev) {
    if (!service.enabled) {
      return;
    }
    var target = ev.target;
    if (!SeamlessPosting.util.isElementEditable(target)) {
      return;
    }
    target = SeamlessPosting.util.getOutMostTarget(target);
    if (target === null) {
      return;
    }
    var res = SeamlessPosting.resource.getByNode('target', target);
    if (res === null) {
      // this target has not been attached any Privly posting stuff
      res = service.createResource(target);
    }
    res.broadcastInternal({
      action: 'posting/internal/targetActivated'
    });
  };

  /**
   * Event listener callback, being called when the target element
   * is deactivated, for example, losing focus.
   * 
   * @param  {Event} ev
   */
  service.onDeactivated = function (ev) {
    var target = ev.target;
    if (!SeamlessPosting.util.isElementEditable(target)) {
      return;
    }
    target = SeamlessPosting.util.getOutMostTarget(target);
    if (target === null) {
      return;
    }
    var res = SeamlessPosting.resource.getByNode('target', target);
    if (res === null) {
      // failed to retrive related resource
      // the DOM structure might be broken by the host page..
      // we don't handle this case.
      return;
    }
    res.broadcastInternal({
      action: 'posting/internal/targetDeactivated'
    });
  };

  /**
   * Event listener callback, being called when mouse down. This
   * event listener is used to capture the target element of a
   * Chrome Extension context menu.
   * 
   * @param  {Event} ev
   */
  service.onMouseDown = function (ev) {
    if (ev.button === 2) {
      service.lastRightClientTarget = ev.target;
    }
  };

  /**
   * Set up DOM event handlers
   */
  service.addEventListeners = function () {
    document.addEventListener('click', service.onActivated, false);
    document.addEventListener('focus', service.onActivated, true);
    document.addEventListener('blur', service.onDeactivated, true);
    document.addEventListener('mousedown', service.onMouseDown, true);
  };

  // async execution, to support `document.open()`
  setTimeout(function () {
    // Bind event listeners immediately :-)
    // Event listeners are binded to the document, so it safe
    // to be executed before `body` being loaded.
    service.addEventListeners();
  }, 0);

  // Check whether Privly button is enabled
  Privly.message.messageExtension({ask: 'options/isPrivlyButtonEnabled'}, true)
    .then(function (enabled) {
      service.enabled = enabled;
    });

  // Listen messages sent from the background script and forward
  // them to the resource object
  Privly.message.addListener(function (message, sendResponse) {
    if (message.targetContextId !== undefined) {
      if (service.contextId !== message.targetContextId) {
        return;
      }
      return SeamlessPosting.resource.broadcast(message, sendResponse);
    }
  });

  // Listen raw chrome messages, to receive clicking context menu
  // messages
  if (chrome && chrome.extension && chrome.extension.onRequest) {
    chrome.extension.onRequest.addListener(function (request) {
      if (request.type === 'RAW' && request.payload.action === 'posting/contextMenuClicked') {
        service.onContextMenuClicked(service.lastRightClientTarget, request.payload.app);
      }
    });
  }

  SeamlessPosting.service = service;

}());
