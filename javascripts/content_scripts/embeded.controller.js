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

  controller.onButtonClick = function (ev) {
    var res = Embeded.resource.getByNode('button', ev.target);
    if (res === null) {
      return;
    }
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
    document.addEventListener('PrivlyButtonClick', controller.onButtonClick);
  };

  Privly.message.messageExtension({ask: 'options/isPrivlyButtonEnabled'}, true)
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
