/*global describe, it, expect, beforeEach, afterEach, spyOn */
/*global Privly, SeamlessPosting */
describe('posting.button', function () {

  var msg = {};
  var resButton, resTarget, target, res;

  beforeEach(function () {
    target = document.createElement('div');
    document.body.appendChild(target);

    res = new SeamlessPosting.Resource();
    resTarget = new SeamlessPosting.Target(target);
    res.setInstance('target', resTarget);

    resButton = new SeamlessPosting.Button();
    res.setInstance('button', resButton);

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

  it('onMouseEnter() sends posting/internal/buttonMouseEntered to resource items', function () {
    resButton.onMouseEnter();
    expect(msg['posting/internal/buttonMouseEntered']).toBeDefined();
  });

  it('onMouseLeave() sends posting/internal/buttonMouseLeft to resource items', function () {
    resButton.onMouseLeave();
    expect(msg['posting/internal/buttonMouseLeft']).toBeDefined();
  });

  it('onClick() sends posting/internal/buttonClicked to resource items only when it is in a clickable state', function () {
    resButton.onStateChanged({state: 'CLOSE'});
    resButton.onSetLoading({state: false});
    resButton.onClick();
    expect(msg['posting/internal/buttonClicked']).toBeDefined();
    msg = {};

    resButton.onStateChanged({state: 'CLOSE'});
    resButton.onSetLoading({state: true});
    resButton.onClick();
    expect(msg['posting/internal/buttonClicked']).not.toBeDefined();
    msg = {};

    resButton.onStateChanged({state: 'OPEN'});
    resButton.onSetLoading({state: false});
    resButton.onClick();
    expect(msg['posting/internal/buttonClicked']).toBeDefined();
    msg = {};

    resButton.onStateChanged({state: 'OPEN'});
    resButton.onSetLoading({state: true});
    resButton.onClick();
    expect(msg['posting/internal/buttonClicked']).not.toBeDefined();
  });

  it('posting/internal/targetPositionChanged calls updatePosition', function () {
    spyOn(resButton, 'updatePosition');
    resButton.onMessage({
      action: 'posting/internal/targetPositionChanged'
    });
    expect(resButton.updatePosition).toHaveBeenCalled();
  });

  it('posting/internal/targetActivated calls updatePosition', function () {
    spyOn(resButton, 'updatePosition');
    resButton.onMessage({
      action: 'posting/internal/targetActivated'
    });
    expect(resButton.updatePosition).toHaveBeenCalled();
  });

  it('posting/internal/targetActivated calls postponeHide', function () {
    spyOn(resButton, 'postponeHide');
    resButton.onMessage({
      action: 'posting/internal/targetActivated'
    });
    expect(resButton.postponeHide).toHaveBeenCalled();
  });

  it('posting/internal/targetDeactivated calls postponeHide', function () {
    spyOn(resButton, 'postponeHide');
    resButton.onMessage({
      action: 'posting/internal/targetDeactivated'
    });
    expect(resButton.postponeHide).toHaveBeenCalled();
  });

  it('show() calls updateVisibility', function () {
    spyOn(resButton, 'updateVisibility');
    resButton.show();
    expect(resButton.isVisible).toBe(true);
    expect(resButton.updateVisibility).toHaveBeenCalled();
  });

  it('hide() calls updateVisibility', function () {
    spyOn(resButton, 'updateVisibility');
    resButton.hide();
    expect(resButton.isVisible).toBe(false);
    expect(resButton.updateVisibility).toHaveBeenCalled();
  });

  it('postponeHide() calls hide', function (done) {
    spyOn(resButton, 'hide').and.callThrough();
    resButton.postponeHide(10);
    setTimeout(function () {
      expect(resButton.hide).toHaveBeenCalled();
      expect(resButton.isVisible).toBe(false);
      done();
    }, 100);
  });

  it('postponeHide() cancels previous postponed hide action', function (done) {
    spyOn(resButton, 'hide').and.callThrough();
    resButton.show();
    resButton.postponeHide(10);
    resButton.postponeHide(1000);
    setTimeout(function () {
      expect(resButton.hide).not.toHaveBeenCalled();
      expect(resButton.isVisible).toBe(true);
      resButton.cancelPostponeHide();
      done();
    }, 100);
  });

  // button position not tested

});
