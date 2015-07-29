/*global describe, it, expect, beforeEach, afterEach, spyOn */
/*global Privly, SeamlessPosting */
describe('posting.app', function () {

  var msg = {};
  var resApp, resTarget, target, res;

  beforeEach(function () {
    target = document.createElement('div');
    document.body.appendChild(target);

    res = new SeamlessPosting.Resource();
    resTarget = new SeamlessPosting.Target(target);
    res.setInstance('target', resTarget);

    resApp = new SeamlessPosting.App('Plainpost');
    resApp.getExtensionUrl = function (url) {
      return url;
    };

    res.setInstance('app', resApp);

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

  it('messageApp() send messages', function () {
    resApp.messageApp({
      action: 'posting/test'
    }, true);
    expect(msg['posting/test']).toBeDefined();
    expect(msg['posting/test'].targetAppId).toBe(resApp.appId);
    expect(msg['posting/test'].hasResponse).toBe(true);
  });

  it('posting/contentScript/TTLChanged sends posting/app/setTTL to app', function () {
    resApp.onMessage({
      action: 'posting/contentScript/TTLChanged',
      value: '1234'
    });
    expect(msg['posting/app/setTTL']).toBeDefined();
    expect(msg['posting/app/setTTL'].ttl).toBe('1234');
  });

  it('posting/internal/appFocused sends posting/background/focused to background script', function () {
    resApp.onMessage({
      action: 'posting/internal/appFocused'
    });
    expect(msg['posting/background/focused']).toBeDefined();
  });

  it('posting/internal/appBlurred sends posting/background/blurred to background script', function () {
    resApp.onMessage({
      action: 'posting/internal/appBlurred'
    });
    expect(msg['posting/background/blurred']).toBeDefined();
  });

  it('posting/contentScript/appStarted changes resource state', function () {
    resApp.onMessage({
      action: 'posting/contentScript/appStarted'
    });
    expect(res.getState()).toBe('OPEN');
  });

  it('posting/contentScript/appClosed changes resource state', function () {
    resApp.onMessage({
      action: 'posting/contentScript/appClosed'
    });
    expect(res.getState()).toBe('CLOSE');
  });

  it('posting/internal/closeRequested sends posting/app/userClose to app', function () {
    resApp.onMessage({
      action: 'posting/internal/closeRequested'
    });
    expect(msg['posting/app/userClose']).toBeDefined();
  });

  it('posting/internal/stateChanged sends posting/app/stateChanged to app', function () {
    resApp.onMessage({
      action: 'posting/internal/stateChanged',
      state: 'OPEN'
    });
    expect(msg['posting/app/stateChanged']).toBeDefined();
  });

  it('destroy() is called when state changed to CLOSE', function () {
    spyOn(resApp, 'destroy');
    resApp.onMessage({
      action: 'posting/internal/stateChanged',
      state: 'CLOSE'
    });
    expect(resApp.destroy).toHaveBeenCalled();
  });

  it('copyStyle() is called when state changed to OPEN', function () {
    spyOn(resApp, 'copyStyle');
    resApp.onMessage({
      action: 'posting/internal/stateChanged',
      state: 'OPEN'
    });
    expect(resApp.copyStyle).toHaveBeenCalled();
  });

  it('copyStyle() sends posting/app/updateStyles to app', function () {
    target.style.fontSize = '10px';
    resApp.copyStyle();
    expect(msg['posting/app/updateStyles']).toBeDefined();
    expect(msg['posting/app/updateStyles'].styles['font-size']).toBe('10px');
  });

  it('onIFrameBlur() sends posting/internal/appBlurred to resource items', function () {
    resApp.onIFrameBlur();
    expect(msg['posting/internal/appBlurred']).toBeDefined();
  });

  it('onTextareaBlurred() sends posting/internal/appBlurred to resource items', function () {
    resApp.onTextareaBlurred();
    expect(msg['posting/internal/appBlurred']).toBeDefined();
  });

  it('onTextareaFocused() sends posting/internal/appFocused to resource items', function () {
    resApp.onTextareaFocused();
    expect(msg['posting/internal/appFocused']).toBeDefined();
  });

  it('reposition() updates position and size', function () {
    target.style.position = 'absolute';
    target.style.left = '100px';
    target.style.top = '50px';
    target.style.width = '200px';
    target.style.height = '10px';
    resApp.reposition();
    expect(resApp.getNode().style.left).toBe('100px');
    expect(resApp.getNode().style.top).toBe('50px');
    expect(resApp.getNode().style.width).toBe('200px');
    expect(resApp.getNode().style.height).toBe('10px');
  });

});
