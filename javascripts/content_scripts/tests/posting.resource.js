/*global describe, it, expect, spyOn */
/*global SeamlessPosting */
describe('posting.resource', function () {

  it('Resource::constructor generates unique id', function () {
    var map = {}, i, res;
    for (i = 0; i < 10000; ++i) {
      res = new SeamlessPosting.Resource();
      if (map[res.id] === undefined) {
        map[res.id] = true;
      } else {
        // duplicate.. test fails
        expect(false).toBe(true);
        break;
      }
    }
  });

  it('Resource::attach() will add the resource into the resource pool', function () {
    // clear pool
    SeamlessPosting.resource.pool = [];
    var res = new SeamlessPosting.Resource();
    res.attach();
    res.attach();
    expect(SeamlessPosting.resource.pool.length).toBe(1);
    expect(SeamlessPosting.resource.pool[0]).toBe(res);
    expect(res.attached).toBe(true);
    // clear pool
    SeamlessPosting.resource.pool = [];
  });

  it('Resource::detach() will remove the resource from the resource pool', function () {
    SeamlessPosting.resource.pool = [];
    var res_not_to_detach = new SeamlessPosting.Resource();
    res_not_to_detach.attach();
    var res_to_detach = new SeamlessPosting.Resource();
    res_to_detach.attach();
    expect(SeamlessPosting.resource.pool.length).toBe(2);
    expect(SeamlessPosting.resource.pool[0]).toBe(res_not_to_detach);
    expect(SeamlessPosting.resource.pool[1]).toBe(res_to_detach);
    res_to_detach.detach();
    expect(SeamlessPosting.resource.pool.length).toBe(1);
    expect(SeamlessPosting.resource.pool[0]).toBe(res_not_to_detach);
    expect(res_to_detach.attached).toBe(false);
    // let's detach again, nothing should happen
    res_to_detach.detach();
    expect(SeamlessPosting.resource.pool.length).toBe(1);
    expect(SeamlessPosting.resource.pool[0]).toBe(res_not_to_detach);
    // let's add back
    res_to_detach.attach();
    expect(SeamlessPosting.resource.pool.length).toBe(2);
    expect(SeamlessPosting.resource.pool[0]).toBe(res_not_to_detach);
    expect(SeamlessPosting.resource.pool[1]).toBe(res_to_detach);
    expect(res_to_detach.attached).toBe(true);
  });

  it('Resource::setState() will broadcast internal message', function () {
    var res = new SeamlessPosting.Resource();
    spyOn(res, 'broadcastInternal');
    res.setState('x');
    expect(res.broadcastInternal).toHaveBeenCalledWith({
      action: 'posting/internal/stateChanged',
      state: 'x'
    });
    expect(res.getState()).toBe('x');
  });

  it('Resource::destroy() will broadcast internal message', function () {
    var res = new SeamlessPosting.Resource();
    spyOn(res, 'broadcastInternal');
    res.destroy();
    expect(res.broadcastInternal).toHaveBeenCalledWith({
      action: 'posting/internal/resourceDestroyed'
    });
  });

  it('Resource::destroy() will detach itself', function () {
    var res = new SeamlessPosting.Resource();
    spyOn(res, 'detach');
    res.attach();
    res.destroy();
    expect(res.detach).toHaveBeenCalled();
  });

  it('Resource::setInstance() will attach resource item to the resource', function () {
    var resItem = new SeamlessPosting.ResourceItem();
    var res = new SeamlessPosting.Resource();
    res.setInstance('tmp', resItem);
    expect(res.getInstance('tmp')).toBe(resItem);
    expect(resItem.resource).toBe(res);
  });

  it('Resource::setInstance() will detach previous attached resource item', function () {
    var resItem1 = new SeamlessPosting.ResourceItem();
    var resItem2 = new SeamlessPosting.ResourceItem();
    spyOn(resItem1, 'detachResource').and.callThrough();

    var res = new SeamlessPosting.Resource();
    res.setInstance('tmp', resItem1);
    res.setInstance('tmp', resItem2);
    expect(resItem1.detachResource).toHaveBeenCalled();
    expect(res.getInstance('tmp')).toBe(resItem2);
    expect(resItem2.resource).toBe(res);
  });

  it('ResourceItem::addMessageListener() will add message listener', function () {
    var resItem = new SeamlessPosting.ResourceItem();
    var foo = function () {};
    var handlerCalled = 0;
    resItem.addMessageListener('myaction', function (msg, sendResponse) {
      handlerCalled++;
      expect(msg.magic).toBe('yes!');
      expect(sendResponse).toBe(foo);
      return true;
    });
    var keep = resItem.onMessage({
      action: 'myaction',
      magic: 'yes!'
    }, foo);
    expect(handlerCalled).toBe(1);
    expect(keep).toBe(true);
  });

  // test true/false
  it('Resource::onMessage() will send message to all message listeners in all attached resource items (1)', function () {
    var resItem1 = new SeamlessPosting.ResourceItem();
    var resItem2 = new SeamlessPosting.ResourceItem();
    resItem1.onMessage = function () {
      return true;
    };
    resItem2.onMessage = function () {
      return false;
    };
    spyOn(resItem1, 'onMessage').and.callThrough();
    spyOn(resItem2, 'onMessage').and.callThrough();

    var res = new SeamlessPosting.Resource();
    res.setInstance('item1', resItem1);
    res.setInstance('item2', resItem2);

    var keep = res.onMessage({
      action: 'myaction'
    }, function () {});
    expect(resItem1.onMessage).toHaveBeenCalled();
    expect(resItem2.onMessage).toHaveBeenCalled();
    expect(keep).toBe(true);
  });

  // test false/false
  it('Resource::onMessage() will send message to all message listeners in all attached resource items (2)', function () {
    var resItem1 = new SeamlessPosting.ResourceItem();
    var resItem2 = new SeamlessPosting.ResourceItem();
    resItem1.onMessage = function () {
      return false;
    };
    resItem2.onMessage = function () {
      return true;
    };
    spyOn(resItem1, 'onMessage').and.callThrough();
    spyOn(resItem2, 'onMessage').and.callThrough();

    var res = new SeamlessPosting.Resource();
    res.setInstance('item1', resItem1);
    res.setInstance('item2', resItem2);

    var keep = res.onMessage({
      action: 'myaction'
    }, function () {});
    expect(resItem1.onMessage).toHaveBeenCalled();
    expect(resItem2.onMessage).toHaveBeenCalled();
    expect(keep).toBe(true);
  });

  // test undefined/undefined
  it('Resource::onMessage() will send message to all message listeners in all attached resource items (3)', function () {
    var resItem1 = new SeamlessPosting.ResourceItem();
    var resItem2 = new SeamlessPosting.ResourceItem();
    resItem1.onMessage = function () {
      // false
    };
    resItem2.onMessage = function () {
      // false
    };
    spyOn(resItem1, 'onMessage').and.callThrough();
    spyOn(resItem2, 'onMessage').and.callThrough();

    var res = new SeamlessPosting.Resource();
    res.setInstance('item1', resItem1);
    res.setInstance('item2', resItem2);

    var keep = res.onMessage({
      action: 'myaction'
    }, function () {});
    expect(resItem1.onMessage).toHaveBeenCalled();
    expect(resItem2.onMessage).toHaveBeenCalled();
    expect(keep).toBe(false);
  });

  it('Resource::broadcastInternal() will send message to all message listeners in all attached resource items', function () {
    var resItem1 = new SeamlessPosting.ResourceItem();
    var resItem2 = new SeamlessPosting.ResourceItem();
    spyOn(resItem1, 'onMessage').and.callThrough();
    spyOn(resItem2, 'onMessage').and.callThrough();

    var handlerCalled = 0;

    resItem1.addMessageListener('myaction', function (msg) {
      handlerCalled++;
      expect(msg.magic).toBe('yoo!');
    });

    var res = new SeamlessPosting.Resource();
    res.setInstance('item1', resItem1);
    res.setInstance('item2', resItem2);

    res.broadcastInternal({
      action: 'myaction',
      magic: 'yoo!'
    });
    expect(resItem1.onMessage).toHaveBeenCalled();
    expect(resItem2.onMessage).toHaveBeenCalled();
    expect(handlerCalled).toBe(1);
  });

  it('NodeResourceItem::setNode() works', function () {
    var node = document.createElement('div');
    var resItem = new SeamlessPosting.NodeResourceItem();
    resItem.setNode(node);
    expect(resItem.getNode()).toBe(node);
  });

  it('NodeResourceItem::isValid() works', function () {
    var node = document.createElement('div');
    var resItem = new SeamlessPosting.NodeResourceItem();
    resItem.setNode(node);
    expect(resItem.isValid()).toBe(false);
    document.body.appendChild(node);
    expect(resItem.isValid()).toBe(true);
    document.body.removeChild(node);
  });

  it('NodeResourceItem::destroy() removes node from document', function () {
    var node = document.createElement('div');
    var resItem = new SeamlessPosting.NodeResourceItem();
    resItem.setNode(node);
    document.body.appendChild(node);
    resItem.destroy();
    expect(document.body.contains(node));
  });

  it('Resource::destroy() cascades by sending messages', function () {
    var resItem1 = new SeamlessPosting.ResourceItem();
    var resItem2 = new SeamlessPosting.NodeResourceItem();
    spyOn(resItem2, 'destroy').and.callThrough();

    var res = new SeamlessPosting.Resource();
    res.setInstance('item1', resItem1);
    res.setInstance('item2', resItem2);

    res.destroy();

    expect(resItem2.destroy).toHaveBeenCalled();
  });

  it('Resource::isValid() returns true only when attached `target` resource items are valid', function () {
    var node = document.createElement('div');
    var resItem1 = new SeamlessPosting.ResourceItem();
    var resItem2 = new SeamlessPosting.NodeResourceItem();
    resItem2.setNode(node);
    // resItem1.valid is true
    // resItem2.valid is false

    var res = new SeamlessPosting.Resource();
    res.setInstance('item1', resItem1);
    res.setInstance('target', resItem2);
    expect(res.isValid()).toBe(false);

    document.body.appendChild(node);
    expect(res.isValid()).toBe(true);
  });

  it('Resource::removeInstanceByNode() works', function () {
    var node1 = document.createElement('div');
    var node2 = document.createElement('div');
    var resItem1 = new SeamlessPosting.NodeResourceItem();
    var resItem2 = new SeamlessPosting.NodeResourceItem();
    var resItem3 = new SeamlessPosting.ResourceItem();
    var resItem4 = new SeamlessPosting.ResourceItem();
    resItem1.setNode(node1);
    resItem2.setNode(node2);

    var res = new SeamlessPosting.Resource();
    res.setInstance('item1', resItem1);
    res.setInstance('item2', resItem2);
    res.setInstance('item3', resItem3);
    res.setInstance('item4', resItem4);

    expect(res.getInstance('item1')).toBe(resItem1);

    res.removeInstanceByNode(node1);
    expect(res.getInstance('item1')).toBe(undefined);
    expect(res.getInstance('item2')).toBe(resItem2);
    expect(res.getInstance('item3')).toBe(resItem3);
    expect(res.getInstance('item4')).toBe(resItem4);
  });

  it('resource.getByNode() works', function () {
    var node1 = document.createElement('div');
    var node2 = document.createElement('div');
    var node3 = document.createElement('div');
    document.body.appendChild(node1);
    document.body.appendChild(node2);
    document.body.appendChild(node3);

    var resItem1 = new SeamlessPosting.NodeResourceItem();
    var resItem2 = new SeamlessPosting.NodeResourceItem();
    var resItem3 = new SeamlessPosting.ResourceItem();
    var resItem4 = new SeamlessPosting.ResourceItem();
    var resItem5 = new SeamlessPosting.NodeResourceItem();
    resItem1.setNode(node1);
    resItem2.setNode(node2);
    resItem5.setNode(node3);

    var res1 = new SeamlessPosting.Resource();
    res1.attach();
    res1.setInstance('item1', resItem1);
    res1.setInstance('item2', resItem2);
    res1.setInstance('item3', resItem3);
    res1.setInstance('item4', resItem4);

    var res2 = new SeamlessPosting.Resource();
    res2.attach();
    res2.setInstance('item1', resItem5);

    expect(SeamlessPosting.resource.getByNode('item1', node1)).toBe(res1);
    expect(SeamlessPosting.resource.getByNode('item1', node2)).toBe(null);
    expect(SeamlessPosting.resource.getByNode('item1', node3)).toBe(res2);
  });

  it('resource.broadcast() works (1)', function () {
    var res1 = new SeamlessPosting.Resource();
    res1.attach();
    var res2 = new SeamlessPosting.Resource();
    res2.attach();
    var res3 = new SeamlessPosting.Resource();
    // res3 is not attached, thus broadcast should only valid to res1 & res2

    spyOn(res1, 'onMessage');
    spyOn(res2, 'onMessage');
    spyOn(res3, 'onMessage');

    // wildcard broadcast
    SeamlessPosting.resource.broadcast({
      action: 'hello!'
    });
  });

  it('resource.broadcast() works (2)', function () {
    var res1 = new SeamlessPosting.Resource();
    res1.attach();
    var res2 = new SeamlessPosting.Resource();
    res2.attach();
    var res3 = new SeamlessPosting.Resource();
    // res3 is not attached, thus broadcast should only valid to res1 & res2

    spyOn(res1, 'onMessage');
    spyOn(res2, 'onMessage');
    spyOn(res3, 'onMessage');

    // matched broadcast, only broadcast to res1
    SeamlessPosting.resource.broadcast({
      targetResourceId: res1.id,
      action: 'hello!'
    });

    expect(res1.onMessage).toHaveBeenCalled();
    expect(res2.onMessage).not.toHaveBeenCalled();
    expect(res3.onMessage).not.toHaveBeenCalled();
  });

});
