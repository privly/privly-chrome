/*global Embeded */
/*global Privly */
// If Privly namespace is not initialized, initialize it
var Embeded;
if (Embeded === undefined) {
  Embeded = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (Embeded.controller !== undefined) {
    return;
  }

  var controller = {
    enabled: false
  };

  // generate a unique context id, for identifying later response messages
  var contextId = Math.floor(Math.random() * 0xFFFFFFFF).toString(16) + Date.now().toString(16);
  controller.contextId = contextId;

  controller.createResource = function (targetNode) {
    var res = new Embeded.Resource();
    var targetInstance = new Embeded.Target(targetNode);
    var buttonInstance = new Embeded.Button(targetInstance);
    res.setInstance('target', targetInstance);
    res.setInstance('button', buttonInstance);
    res.attach();
    return res;
  };

  controller.onTargetActivated = function (ev) {
    if (!controller.enabled) {
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
      res = controller.createResource(target);
    }
    Embeded.util.dispatchPrivlyEvent(target, 'PrivlyTargetActivated', {
      resource: res
    });
  };

  controller.onTargetDeactivated = function (ev) {
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
    Embeded.util.dispatchPrivlyEvent(target, 'PrivlyTargetDeactivated', {
      resource: res
    });
  };

  controller.onButtonClick = function (ev) {
    var res = ev.detail.resource;

    if (res.state === 'CLOSE') {
      // at CLOSE state: open
      // when click the Privly button to open: create a new embeded-app and tell the app
      if (res.getInstance('app')) {
        res.getInstance('app').destroy();
      }
      var app = new Embeded.App(res.getInstance('target'), contextId, res.id);
      res.setInstance('app', app);
    } else if (res.state === 'OPEN') {
      // at OPEN state: close
      // clicks the Privly button to close: tell the app
      if (res.getInstance('app')) {
        res.getInstance('app').requestClose();
      }
    }
  };

  controller.addListeners = function () {
    document.addEventListener('click', controller.onTargetActivated, false);
    document.addEventListener('focus', controller.onTargetActivated, true);
    document.addEventListener('blur', controller.onTargetDeactivated, true);
    document.addEventListener('PrivlyButtonClick', controller.onButtonClick);
  };

  Privly.message.messageExtension({ask: 'options/isPrivlyButtonEnabled'})
    .then(function (enabled) {
      controller.enabled = enabled;
    });

  Privly.message.addListener(function (message, sendResponse) {
    if (message.targetContextId !== undefined) {
      if (contextId !== message.targetContextId) {
        return;
      }
      return Embeded.resource.broadcast(message, sendResponse);
    }
  });

  // bind event listeners
  controller.addListeners();

  // expose the interface
  Embeded.controller = controller;

}());
