/*global describe, it, expect, beforeEach, afterEach, spyOn */
/*global Privly, SeamlessPosting */
describe('posting.target', function () {

  it('posting/contentScript/getTargetContent returns false if the target is not in DOM tree', function (done) {
    var target = document.createElement('div');
    target.setAttribute('contentEditable', 'true');
    target.innerHTML = '<p>123</p>';

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/getTargetContent'
    }, function (ret) {
      expect(ret).toBe(false);
      done();
    });
  });

  it('posting/contentScript/getTargetText returns false if the target is not in DOM tree', function (done) {
    var target = document.createElement('div');
    target.setAttribute('contentEditable', 'true');
    target.innerHTML = '<p>123</p>';

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/getTargetText'
    }, function (ret) {
      expect(ret).toBe(false);
      done();
    });
  });

  it('posting/contentScript/setTargetText returns false if the target is not in DOM tree', function (done) {
    var target = document.createElement('div');
    target.setAttribute('contentEditable', 'true');
    target.innerHTML = '<p>123</p>';

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/setTargetText',
      text: 'abcd'
    }, function (ret) {
      expect(ret).toBe(false);
      done();
    });
  });

  it('posting/contentScript/emitEnterEvent returns false if the target is not in DOM tree', function (done) {
    var target = document.createElement('div');
    target.setAttribute('contentEditable', 'true');
    target.innerHTML = '<p>123</p>';

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/emitEnterEvent',
      keys: {}
    }, function (ret) {
      expect(ret).toBe(false);
      done();
    });
  });

  it('posting/contentScript/insertLink returns false if the target element is not in DOM tree', function (done) {
    var target = document.createElement('div');
    target.setAttribute('contentEditable', 'true');
    target.innerHTML = '<p>123</p>';

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/insertLink',
      link: 'https://privlyalpha.org/posts/1.json'
    }, function (ret) {
      expect(ret).toBe(false);
      done();
    });
  });

  it('posting/contentScript/insertLink works for textarea', function (done) {
    var target = document.createElement('textarea');
    target.value = '1234';
    document.body.appendChild(target);
    target.focus();

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/insertLink',
      link: 'https://privlyalpha.org/posts/1.json'
    }, function (ret) {
      expect(ret).toBe(true);
      expect(target.value.trim()).toBe('https://privlyalpha.org/posts/1.json');
      document.body.removeChild(target);
      done();
    });
  });

  it('posting/contentScript/insertLink works for contenteditable elements', function (done) {
    var target = document.createElement('div');
    target.setAttribute('contentEditable', 'true');
    target.innerHTML = '<p>123</p>';
    document.body.appendChild(target);
    target.focus();

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/insertLink',
      link: 'https://privlyalpha.org/posts/1.json'
    }, function (ret) {
      expect(ret).toBe(true);
      expect(target.innerText.trim()).toBe('https://privlyalpha.org/posts/1.json');
      document.body.removeChild(target);
      done();
    });
  });

  it('posting/contentScript/getTargetContent works for contenteditable elements', function (done) {
    var target = document.createElement('div');
    target.setAttribute('contentEditable', 'true');
    target.innerHTML = '<p>123</p>';
    document.body.appendChild(target);

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/getTargetContent'
    }, function (ret) {
      expect(ret).toBe('<p>123</p>');
      document.body.removeChild(target);
      done();
    });
  });

  it('posting/contentScript/getTargetText works for contenteditable elements', function (done) {
    var target = document.createElement('div');
    target.setAttribute('contentEditable', 'true');
    target.innerHTML = '<p>123</p>';
    document.body.appendChild(target);

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/getTargetText'
    }, function (ret) {
      expect(ret).toBe('123');
      document.body.removeChild(target);
      done();
    });
  });

  it('posting/contentScript/getTargetContent works for textareas', function (done) {
    var target = document.createElement('textarea');
    target.value = '1234';
    document.body.appendChild(target);

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/getTargetContent'
    }, function (ret) {
      expect(ret).toBe('1234');
      document.body.removeChild(target);
      done();
    });
  });

  it('posting/contentScript/getTargetText works for textareas', function (done) {
    var target = document.createElement('textarea');
    target.value = '1234';
    document.body.appendChild(target);

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/getTargetText'
    }, function (ret) {
      expect(ret).toBe('1234');
      document.body.removeChild(target);
      done();
    });
  });

  it('posting/contentScript/setTargetText works for contenteditable elements', function (done) {
    var target = document.createElement('div');
    target.setAttribute('contentEditable', 'true');
    target.innerHTML = '<p>123</p>';
    document.body.appendChild(target);

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/setTargetText',
      text: '12345'
    }, function (ret) {
      expect(ret).toBe(true);
      expect(target.innerText).toBe('12345');
      document.body.removeChild(target);
      done();
    });
  });

  it('posting/contentScript/setTargetText works for textareas', function (done) {
    var target = document.createElement('textarea');
    target.value = '1234';
    document.body.appendChild(target);

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/setTargetText',
      text: '12345'
    }, function (ret) {
      expect(ret).toBe(true);
      expect(target.value).toBe('12345');
      document.body.removeChild(target);
      done();
    });
  });

  it('posting/contentScript/emitEnterEvent dispatch keyboard events', function (done) {
    var target = document.createElement('textarea');
    target.value = '1234';
    document.body.appendChild(target);

    var keyDown = false;
    target.addEventListener('keydown', function (ev) {
      if (ev.keyCode === 13) {
        keyDown = true;
      }
    });

    var resTarget = new SeamlessPosting.Target(target);
    resTarget.onMessage({
      action: 'posting/contentScript/emitEnterEvent'
    }, function (ret) {
      expect(ret).toBe(true);
      expect(keyDown).toBe(true);
      document.body.removeChild(target);
      done();
    });
  });

  it('startResizeMonitor() calls detectResize periodically', function (done) {
    var target = document.createElement('textarea');
    document.body.appendChild(target);

    var resTarget = new SeamlessPosting.Target(target);
    var count = 0;
    resTarget.detectResize = function () {
      count++;
    };

    resTarget.startResizeMonitor();
    resTarget.startResizeMonitor();
    resTarget.startResizeMonitor();

    setTimeout(function () {
      expect(count).toBe(1);
      resTarget.stopResizeMonitor();
      expect(resTarget.resizeMonitor).toBe(null);
      resTarget.stopResizeMonitor();
      expect(resTarget.resizeMonitor).toBe(null);
      document.body.removeChild(target);
      done();
    }, 400);
  });

  it('detectResize() stops resize monitor if DOM is not in the DOM tree', function () {
    var target = document.createElement('textarea');
    var resTarget = new SeamlessPosting.Target(target);
    spyOn(resTarget, 'stopResizeMonitor').and.callThrough();
    resTarget.startResizeMonitor();
    resTarget.detectResize();
    expect(resTarget.stopResizeMonitor).toHaveBeenCalled();
  });

  it('detectResize() stops resize monitor if the resource item is not attached', function () {
    var target = document.createElement('textarea');
    document.body.appendChild(target);
    var resTarget = new SeamlessPosting.Target(target);
    spyOn(resTarget, 'stopResizeMonitor').and.callThrough();
    resTarget.startResizeMonitor();
    resTarget.detectResize();
    expect(resTarget.stopResizeMonitor).toHaveBeenCalled();
    document.body.removeChild(target);
  });

  it('detectResize() stops resize monitor if the DOM is invisible', function () {
    var target = document.createElement('textarea');
    document.body.appendChild(target);
    var resTarget = new SeamlessPosting.Target(target);
    var res = new SeamlessPosting.Resource();
    res.setInstance('target', resTarget);
    target.style.display = 'none';
    spyOn(resTarget, 'stopResizeMonitor').and.callThrough();
    resTarget.startResizeMonitor();
    resTarget.detectResize();
    expect(resTarget.stopResizeMonitor).toHaveBeenCalled();
    document.body.removeChild(target);
  });

  it('detectResize() sends posting/internal/targetPositionChanged', function () {
    var target = document.createElement('textarea');
    document.body.appendChild(target);
    var resTarget = new SeamlessPosting.Target(target);
    var res = new SeamlessPosting.Resource();
    res.setInstance('target', resTarget);
    var oldBroadcastInternal = res.broadcastInternal;
    var msg = {};
    res.broadcastInternal = function (message) {
      // release resources
      if (message.action === 'posting/internal/resourceDestroyed') {
        oldBroadcastInternal.call(res, message);
      }
      msg[message.action] = message;
    };

    resTarget.detectResize();
    expect(msg['posting/internal/targetPositionChanged']).toBeDefined();

    // let's do it again. since target DOM is unchanged, no messages should be sent.
    msg = {};
    resTarget.detectResize();
    expect(msg['posting/internal/targetPositionChanged']).not.toBeDefined();

    // let's change position and try again..
    msg = {};
    target.style.height = '500px';
    resTarget.detectResize();
    expect(msg['posting/internal/targetPositionChanged']).toBeDefined();

    // clean up
    document.body.removeChild(target);
  });

  it('posting/internal/stateChanged enables or disables resize monitor', function () {
    var target = document.createElement('textarea');
    target.value = '1234';
    document.body.appendChild(target);

    var resTarget = new SeamlessPosting.Target(target);
    var res = new SeamlessPosting.Resource();
    res.setInstance('target', resTarget);

    // state change to open: enable resize monitor
    resTarget.onMessage({
      action: 'posting/internal/stateChanged',
      state: 'OPEN'
    });
    expect(resTarget.resizeMonitor !== null).toBe(true);

    resTarget.onMessage({
      action: 'posting/internal/stateChanged',
      state: 'CLOSE'
    });
    expect(resTarget.resizeMonitor === null).toBe(true);

    // clean up
    document.body.removeChild(target);
  });

  it('resize monitor is enabled when target is activated or seamless posting is open, otherwise it is disabled', function () {
    var target = document.createElement('textarea');
    target.value = '1234';
    document.body.appendChild(target);

    var resTarget = new SeamlessPosting.Target(target);
    var res = new SeamlessPosting.Resource();
    res.setInstance('target', resTarget);

    resTarget.onMessage({
      action: 'posting/internal/targetActivated'
    });
    resTarget.onMessage({
      action: 'posting/internal/stateChanged',
      state: 'CLOSE'
    });
    expect(resTarget.resizeMonitor !== null).toBe(true);

    resTarget.onMessage({
      action: 'posting/internal/targetActivated',
    });
    resTarget.onMessage({
      action: 'posting/internal/stateChanged',
      state: 'OPEN'
    });
    expect(resTarget.resizeMonitor !== null).toBe(true);

    resTarget.onMessage({
      action: 'posting/internal/targetDeactivated'
    });
    resTarget.onMessage({
      action: 'posting/internal/stateChanged',
      state: 'CLOSE'
    });
    expect(resTarget.resizeMonitor === null).toBe(true);

    document.body.removeChild(target);
  });

});
