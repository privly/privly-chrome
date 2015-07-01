/**
 * @fileOverview Handle the creation and control
 * of the resource object, which is associated to
 * the target element.
 *
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    embeded/internal/targetActivated
 *        when the target element is activated (got focus
 *        or clicked)
 *
 *    embeded/internal/targetDeactivated
 *        when the target element is deactivated (lost focus)
 */
/*global Embeded, Privly */
// If Privly namespace is not initialized, initialize it
var Embeded;
if (Embeded === undefined) {
  Embeded = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (Embeded.service !== undefined) {
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
     * Whether embeded posting button is enabled
     * @type {Boolean}
     */
    enabled: false,

    /**
     * A unique id for the current content context
     * @type {String}
     */
    contextId: Math.floor(Math.random() * 0xFFFFFFFF).toString(16) + Date.now().toString(16)
  };

  /**
   * Create a resource object for the specified target node.
   * `Embeded.Target` and `Embeded.Button` instance will be created
   * and attached to the newly created resource object.
   * 
   * The resource object will be added to the global resource pool,
   * for being referenced in other modules.
   * 
   * @param  {Element} targetNode The editable element
   * @return {Embeded.Resource}
   */
  service.createResource = function (targetNode) {
    var res = new Embeded.Resource();
    var controllerInstance = new Embeded.Controller();
    var targetInstance = new Embeded.Target(targetNode);
    var buttonInstance = new Embeded.Button(targetInstance);
    res.setInstance('controller', controllerInstance);
    res.setInstance('target', targetInstance);
    res.setInstance('button', buttonInstance);
    res.attach();
    return res;
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
    if (!Embeded.util.isElementEditable(target)) {
      return;
    }
    target = Embeded.util.getOutMostTarget(target);
    var res = Embeded.resource.getByNode('target', target);
    if (res === null) {
      // this target has not been attached any Privly posting stuff
      res = service.createResource(target);
    }
    res.broadcastInternal({
      action: 'embeded/internal/targetActivated'
    });
  };

  /**
   * Event listener callback, being called when the target element
   * is deactivated, for example, losing focus.
   * 
   * @param  {[type]} ev [description]
   * @return {[type]}    [description]
   */
  service.onDeactivated = function (ev) {
    var target = ev.target;
    if (!Embeded.util.isElementEditable(target)) {
      return;
    }
    target = Embeded.util.getOutMostTarget(target);
    var res = Embeded.resource.getByNode('target', target);
    if (res === null) {
      // failed to retrive related resource
      // the DOM structure might be broken by the host page..
      // we don't handle this case.
      return;
    }
    res.broadcastInternal({
      action: 'embeded/internal/targetDeactivated'
    });
  };

  /**
   * Set up DOM event handlers
   */
  service.addEventListeners = function () {
    document.addEventListener('click', service.onActivated, false);
    document.addEventListener('focus', service.onActivated, true);
    document.addEventListener('blur', service.onDeactivated, true);
  };

  // Bind event listeners immediately :-)
  // Event listeners are binded to the document, so it safe
  // to be executed before `body` being loaded.
  service.addEventListeners();

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
      return Embeded.resource.broadcast(message, sendResponse);
    }
  });

  Embeded.service = service;

}());
