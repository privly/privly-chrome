/*global Embeded */
// If Privly namespace is not initialized, initialize it
var Embeded;
if (Embeded === undefined) {
  Embeded = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (Embeded.Resource !== undefined) {
    return;
  }

  var resourceCounter = 0;

  var Resource = function () {
    this.attached = false;
    this.instances = {};
    this.state = 'CLOSE';
    this.id = Math.floor(Math.random() * 0xFFFFFFFF).toString(16) + Date.now().toString(16) + (++resourceCounter).toString(16);
  };

  var resource = {};
  resource.pool = [];

  resource.getByNode = function (type, node) {
    var i;
    for (i = 0; i < resource.pool.length; ++i) {
      if (resource.pool[i].getInstance(type).getNode() === node) {
        // after we found an instance, we also check
        // whether the whole resource is valid.
        // if it is not, null will be returned.
        if (!resource.pool[i].isValid()) {
          resource.pool[i].destroy();
          return null;
        }
        return resource.pool[i];
      }
    }
    return null;
  };

  resource.broadcast = function (message, sendResponse) {
    var i, keepChannel = false;
    for (i = 0; i < resource.pool.length; ++i) {
      if (message.targetResourceId === undefined || resource.pool[i].id === message.targetResourceId) {
        if (resource.pool[i].onMessage(message, sendResponse) === true) {
          keepChannel = true;
        }
      }
    }
    return keepChannel;
  };

  resource.forEach = function (callback) {
    resource.pool.forEach(callback);
  };

  Resource.prototype.isValid = function () {
    var type;
    for (type in this.instances) {
      // for each instance, call its `isValid()` interface
      if (typeof this.instances[type].isValid === 'function') {
        if (!this.instances[type].isValid()) {
          return false;
        }
      }
    }
    return true;
  };

  Resource.prototype.destroy = function () {
    var type;
    for (type in this.instances) {
      // for each instance, call its `destroy()` interface
      if (typeof this.instances[type].destroy === 'function') {
        this.instances[type].destroy();
      }
    }
    // if this resource is added to the resource pool,
    // it should be removed.
    if (this.attached) {
      this.detach();
    }
  };

  Resource.prototype.setState = function (state) {
    var type;
    for (type in this.instances) {
      // for each instance, call its `setState()` interface
      if (typeof this.instances[type].setState === 'function') {
        this.instances[type].setState(state);
      }
    }
    this.state = state;
    return true;
  };

  Resource.prototype.getState = function () {
    return this.state;
  };

  Resource.prototype.attach = function () {
    if (this.attached) {
      return;
    }
    resource.pool.push(this);
    this.attached = true;
  };

  Resource.prototype.detach = function () {
    if (!this.attached) {
      return;
    }
    var i;
    for (i = 0; i < resource.pool.length; ++i) {
      if (resource.pool[i] === this) {
        resource.pool.splice(i, 1);
        break;
      }
    }
    this.attached = false;
  };

  Resource.prototype.setInstance = function (type, instance) {
    if (this.instances[type]) {
      // if there is already an instance using the same type name,
      // that instance will be detached from this resource.
      if (typeof this.instances[type].detachResource === 'function') {
        this.instances[type].detachResource();
      }
    }
    // the instance should be notified about the attach action
    if (typeof instance.attachResource === 'function') {
      instance.attachResource(this);
    }
    // for the resource itself, it should record the new instance
    this.instances[type] = instance;
  };

  Resource.prototype.getInstance = function (type) {
    return this.instances[type];
  };

  Resource.prototype.onMessage = function (message, sendResponse) {
    var type;
    var keepChannel = false;
    for (type in this.instances) {
      if (typeof this.instances[type].onMessage === 'function') {
        if (this.instances[type].onMessage(message, sendResponse) === true) {
          keepChannel = true;
        }
      }
    }
    return keepChannel;
  };

  Resource.prototype.removeInstanceByNode = function (node) {
    var type;
    for (type in this.instances) {
      if (typeof this.instances[type].getNode === 'function') {
        if (this.instances[type].getNode() === node) {
          if (typeof this.instances[type].detachResource === 'function') {
            this.instances[type].detachResource();
          }
          delete this.instances[type];
          return true;
        }
      }
    }
    return false;
  };

  var NodeResourceItem = function () {};
  NodeResourceItem.prototype.setNode = function (node) {
    this.node = node;
  };
  NodeResourceItem.prototype.getNode = function () {
    return this.node;
  };
  NodeResourceItem.prototype.destroy = function () {
    if (document.body.contains(this.node) && this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }
    if (this.resource) {
      this.resource.removeInstanceByNode(this.node);
    }
  };
  NodeResourceItem.prototype.isValid = function () {
    return document.body.contains(this.node);
  };
  NodeResourceItem.prototype.attachResource = function (res) {
    this.resource = res;
  };
  NodeResourceItem.prototype.detachResource = function () {
    this.resource = null;
  };

  Embeded.Resource = Resource;
  Embeded.resource = resource;
  Embeded.NodeResourceItem = NodeResourceItem;

}());
