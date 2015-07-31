/*global describe, it, expect, spyOn, beforeEach, afterEach, window */
/*global Privly, SeamlessPosting */
describe('posting.controller', function () {

  // we need a button res, a target res and the controller res itself
  var msg = {};
  var resButton, resTarget, target, res;
  var resController;

  beforeEach(function () {

    if (!window.chrome) {
      window.chrome = {};
    }
    if (!window.chrome.extension) {
      window.chrome.extension = {};
    }
    if (!window.chrome.extension.getURL) {
      window.chrome.extension.getURL = function (url) {
        return url;
      };
    }

    target = document.createElement('div');
    document.body.appendChild(target);

    res = new SeamlessPosting.Resource();
    resTarget = new SeamlessPosting.Target(target);
    res.setInstance('target', resTarget);

    resButton = new SeamlessPosting.Button();
    res.setInstance('button', resButton);

    resController = new SeamlessPosting.Controller();
    res.setInstance('controller', resController);

    msg = {};
    // Outgoing chrome messages
    Privly.message.messageExtension = function (message) {
      msg[message.action] = message;
    };
    // Outgoing virtual messages
    var oldBroadcastInternal = res.broadcastInternal;
    res.broadcastInternal = function (message) {
      // release resources
      if (message.action === 'posting/internal/resourceDestroyed') {
        oldBroadcastInternal.call(res, message);
      }
      msg[message.action] = message;
    };
  });

  afterEach(function () {
    res.destroy();
    document.body.removeChild(target);
  });

  it('openApp() creates app resource item', function () {
    resController.openApp();
    expect(res.getInstance('app') !== null).toBe(true);
  });

  it('posting/internal/buttonClicked opens app if it is in CLOSE state', function () {
    spyOn(resController, 'openApp');

    res.state = 'CLOSE';
    resController.onMessage({
      action: 'posting/internal/buttonClicked'
    });
    expect(resController.openApp).toHaveBeenCalled();
    expect(msg['posting/internal/closeRequested']).not.toBeDefined();
  });

  it('posting/internal/buttonClicked does not open app if it is in OPEN state', function () {
    spyOn(resController, 'openApp');

    res.state = 'OPEN';
    resController.onMessage({
      action: 'posting/internal/buttonClicked'
    });
    expect(resController.openApp).not.toHaveBeenCalled();
    expect(msg['posting/internal/closeRequested']).toBeDefined();
  });

  it('posting/internal/contextMenuClicked opens app if it is in CLOSE state', function () {
    spyOn(resController, 'openApp');

    res.state = 'CLOSE';
    resController.onMessage({
      action: 'posting/internal/contextMenuClicked',
      app: 'Message'
    });
    expect(resController.openApp).toHaveBeenCalledWith('Message');
  });

  it('posting/internal/contextMenuClicked does not opens app if it is in OPEN state', function () {
    spyOn(resController, 'openApp');

    res.state = 'OPEN';
    resController.onMessage({
      action: 'posting/internal/contextMenuClicked',
      app: 'Message'
    });
    expect(resController.openApp).not.toHaveBeenCalled();
  });

});
