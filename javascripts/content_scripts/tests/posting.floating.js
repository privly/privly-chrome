/*global describe, it, expect, beforeEach, afterEach, spyOn */
/*global Privly, SeamlessPosting */
describe('posting.floating', function () {

  var msg = {};
  var resButton, resTarget, resFloating, target, res, floatingDOM;

  beforeEach(function () {
    target = document.createElement('div');
    document.body.appendChild(target);

    res = new SeamlessPosting.Resource();
    resTarget = new SeamlessPosting.Target(target);
    res.setInstance('target', resTarget);

    resButton = new SeamlessPosting.Button();
    res.setInstance('button', resButton);

    resFloating = new SeamlessPosting.FloatingResourceItem();
    resFloating.createDOM = function () {
      floatingDOM = document.createElement('div');
      floatingDOM.style.position = 'absolute';
      this.setNode(floatingDOM);
    };
    res.setInstance('myfloating', resFloating);

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

  it('throws error when calling createDOM directly', function () {
    var r = new SeamlessPosting.FloatingResourceItem();
    var err;
    try {
      r.createDOM();
    } catch (e) {
      err = e;
    }
    expect(err).toBeDefined();
  });

  it('show() appends DOM', function () {
    expect(document.body.contains(resFloating.getNode())).toBe(false);
    resFloating.show();
    expect(document.body.contains(resFloating.getNode())).toBe(true);
  });

  it('hide() removes DOM after animation completes', function (done) {
    resFloating.show();
    resFloating.hide();
    resFloating.hide();
    expect(document.body.contains(resFloating.getNode())).toBe(true);
    setTimeout(function () {
      expect(document.body.contains(resFloating.getNode())).toBe(false);
      done();
    }, 500);
  });

  it('detachResource() clear timers', function () {
    resFloating.show();
    resFloating.hide();
    resFloating.detachResource();
    expect(resFloating.hideTimer).toBe(null);
  });

  it('detachResource() remove nodes', function () {
    resFloating.show();
    resFloating.detachResource();
    expect(document.body.contains(resFloating.getNode())).toBe(false);
  });

  it('isValid() returns false only if the floating DOM marked as visible but DOM is not in the DOM tree', function () {
    expect(resFloating.isValid()).toBe(true);
    resFloating.show();
    expect(resFloating.isValid()).toBe(true);
    document.body.removeChild(resFloating.getNode());
    expect(resFloating.isValid()).toBe(false);
    resFloating.hide();
    expect(resFloating.isValid()).toBe(true);
  });

  it('show() shows the tooltip inside the screen', function () {
    // the target is close to the right border boundary
    target.style.position = 'absolute';
    target.style.right = '0px';
    target.style.top = '100px';
    target.style.width = '100px';
    resButton.updatePosition();

    // a long floating DOM
    floatingDOM.style.height = '50px';
    floatingDOM.style.width = '300px';

    resFloating.show();

    // test
    var region = floatingDOM.getBoundingClientRect();
    var regionButton = resButton.getNode().getBoundingClientRect();
    expect(region.left + region.width <= window.innerWidth).toBe(true);
    expect(region.top < regionButton.top).toBe(true);
    expect(resFloating.showAbove).toBe(true);

    // the target is close to the top border boundary
    target.style.top = '0px';
    resButton.updatePosition();

    // a high floating DOM
    floatingDOM.style.height = '300px';

    resFloating.show();

    region = floatingDOM.getBoundingClientRect();
    regionButton = resButton.getNode().getBoundingClientRect();
    expect(region.top > regionButton.top).toBe(true);
    expect(resFloating.showAbove).toBe(false);
  });

});
