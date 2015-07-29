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

  it('posting/contentScript/insertLink returns false if the target is not in DOM tree', function (done) {
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
      done();
    });
  });

  it('posting/contentScript/insertLink returns false if the target is not in DOM tree', function (done) {
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
      done();
    });
  });

});
