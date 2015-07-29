/**
 * @fileOverview This file contains three modules,
 * `SeamlessPosting.Resource` `SeamlessPosting.ResourceItem`
 * and `SeamlessPosting.NodeResourceItem`.
 * 
 * Think about the situation that we have a Privly button,
 * a Privly application iframe, a Tooltip box and a Select
 * dropdown (time until burn), on the host page, associated
 * to a single editable element.
 * 
 * We call those components resource items, which is in a
 * resource item collection (resource), associated to the
 * target element.
 *
 * Specially, the resource object also contains a `state`
 * property, managing the current state of the seamless
 * posting form (open or closed).
 *
 * When the target element is destroyed (by the host page),
 * those associated "resources" should be destroyed. When
 * our resource item is destroyed, they should be rebuilt.
 * 
 * Those operations are very complex and the code will be
 * hard to maintain if they are mixed together, so we built
 * a resource management mechanism to handle such kind of
 * tasks, which is the `Resource` class.
 *
 * `ResourceItem` is a base class, implemented some
 * general function for a resource item. Developers
 * can inherit this class to develop own resource
 * item class.
 * 
 * `NodeResourceItem` is a base class, implemented
 * some general and reuseable function for resource
 * which contains DOM node. Developers can inherit
 * this class to implement its own resource item class
 * which is related to node manipulating.
 *
 * This module will broadcast the following internal
 * messages to other modules:
 *
 *    posting/internal/resourceDestroyed
 *        when the resource object is being destroyed
 *
 *    posting/internal/stateChanged
 *        when the state of the resource object is
 *        changed
 *
 */
/*global SeamlessPosting */
// If Privly namespace is not initialized, initialize it
var SeamlessPosting;
if (SeamlessPosting === undefined) {
  SeamlessPosting = {};
}
(function () {

  // If this file is already loaded, don't do it again
  if (SeamlessPosting.Resource !== undefined) {
    return;
  }

  // We assign a unique id to each resource instance,
  // so set up a counter here.
  var resourceCounter = 0;

  /**
   * The resource class
   */
  var Resource = function () {
    /**
     * Whether this resource is attached to the resource pool
     * @type {Boolean}
     */
    this.attached = false;

    /**
     * The resource items. the key is called resource type, for example, button.
     * @type {Object}
     */
    this.instances = {};

    /**
     * The state of this seamless-posting resource
     * @type {String}
     */
    this.state = 'CLOSE';

    /**
     * The seconds_until_burn options of this seamless-posting resource
     * @type {String}
     */
    this.ttl = null;

    /**
     * Unique id
     * @type {String}
     */
    this.id = Math.floor(Math.random() * 0xFFFFFFFF).toString(16) + Date.now().toString(16) + (++resourceCounter).toString(16);
  };

  /**
   * The global pool for all attached resource objects.
   * @type {Object}
   */
  var resource = {};
  resource.pool = [];

  /**
   * Retrive a resource object in the resource pool,
   * by matching the node of one of its resource items
   * 
   * @param  {String} type The key of the resource item
   * @param  {Node} node The node to match
   * @return {Resource|null}
   */
  resource.getByNode = function (type, node) {
    var i, resItem;
    for (i = 0; i < resource.pool.length; ++i) {
      resItem = resource.pool[i].getInstance(type);
      if (resItem && resItem.getNode() === node) {
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

  /**
   * Broadcast a message to all resource items of all attached
   * resource object in the resource pool.
   *
   * If targetResourceId in the message is specified, the message
   * will be sent to the matching resource object only.
   * 
   * @param  {Object} message
   * @param  {Function} sendResponse
   * @return {Boolean} whether the sub message receivers want to
   * keep the message channel open for sending message response later
   */
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

  /**
   * Iterate each resource object attached in the resource pool
   * 
   * @param  {Function} callback
   */
  resource.forEach = function (callback) {
    resource.pool.forEach(callback);
  };

  /**
   * Checking whether this resource object is valid, by
   * checking whether the target resource item is valid.
   * 
   * @return {Boolean}
   */
  Resource.prototype.isValid = function () {
    if (this.instances.target) {
      if (!this.instances.target.isValid()) {
        return false;
      }
    }
    return true;
  };

  /**
   * Destroy the resource and detach the resource from the
   * global resource pool. It will invoke the `destroy()`
   * function of each resource item alternately.
   */
  Resource.prototype.destroy = function () {
    this.broadcastInternal({
      action: 'posting/internal/resourceDestroyed'
    });
    // if this resource is added to the resource pool,
    // it should be removed.
    if (this.attached) {
      this.detach();
    }
  };

  /**
   * Set the state of this resource object. This function
   * will invoke the `setState()` function of each resource
   * item alternately.
   */
  Resource.prototype.setState = function (state) {
    this.state = state;
    this.broadcastInternal({
      action: 'posting/internal/stateChanged',
      state: state
    });
    return true;
  };

  /**
   * Get the state of this resource object.
   * @return {String}
   */
  Resource.prototype.getState = function () {
    return this.state;
  };

  /**
   * Attach the resource object to the global
   * resource pool.
   */
  Resource.prototype.attach = function () {
    if (this.attached) {
      return;
    }
    resource.pool.push(this);
    this.attached = true;
  };

  /**
   * Detach the resource object from the global
   * resource pool.
   */
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

  /**
   * Add a resource item into this resource.
   * 
   * @param {String} type The key
   * @param {ResourceItem} instance The resource item object
   */
  Resource.prototype.setInstance = function (type, instance) {
    if (this.instances[type]) {
      // if there is already an instance using the same type name,
      // that instance will be detached from this resource.
      if (typeof this.instances[type].detachResource === 'function') {
        this.instances[type].detachResource();
      }
    }
    // for the resource itself, it should record the new instance
    this.instances[type] = instance;
    // the instance should be notified about the attach action
    if (typeof instance.attachResource === 'function') {
      instance.attachResource(this);
    }
  };

  /**
   * Get a resource item of this resource
   * @param  {String} type item key
   * @return {ResourceItem}
   */
  Resource.prototype.getInstance = function (type) {
    return this.instances[type];
  };

  /**
   * Remove a resource item by matching the node of the item.
   * @param  {Node} node
   * @return {Boolean} whether the resource item is successfully
   * removed
   */
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

  /**
   * Message handler when receiving broadcast messages.
   * This function forwards the message to all of the
   * resource items.
   * 
   * @param  {String} message
   * @param  {Function} sendResponse
   * @return {Boolean} whether to keep the response channel open
   */
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

  /**
   * Broadcast a internal message to each resource item.
   * Internal message here means, the message is not
   * generated by the background script, instead it is
   * generated by the resource item or resource object
   * itself.
   *
   * The purpose of broadcast such message is to notify
   * some events to all of the resource item, in a low
   * coupled way.
   *
   * Notice that this kind of message doesn't support
   * receiving response from the receivers.
   * 
   * @param  {Object} message
   */
  Resource.prototype.broadcastInternal = function (message) {
    var sendResponse = function () {};

    // we just reuse the Privly message channel interface
    this.onMessage(message, sendResponse);
  };

  /**
   * A template class for handling general resource item
   * tasks.
   *
   * @class
   */
  var ResourceItem = function () {};

  /**
   * Destroy the resource item and clean up its components
   */
  ResourceItem.prototype.destroy = function () {
    // do nothing
  };

  /**
   * Whether this resource item is valid.
   * Always returns true.
   * 
   * @return {Boolean}
   */
  ResourceItem.prototype.isValid = function () {
    return true;
  };

  /**
   * Save the reference of the attached resource object of this
   * resource item.
   * 
   * @param  {Resource} res
   */
  ResourceItem.prototype.attachResource = function (res) {
    this.resource = res;
  };

  /**
   * Clear the reference of the attached resource object.
   */
  ResourceItem.prototype.detachResource = function () {
    this.resource = null;
  };

  /**
   * Dispatch the message to all message listeners
   * @param  {Object} message
   * @param  {Function} sendResponse
   * @return {Boolean} whether to preserve the respond channel
   */
  ResourceItem.prototype.onMessage = function (message, sendResponse) {
    if (this._listeners === undefined) {
      return;
    }
    // we only handle messages that have action property
    if (message === null || typeof message !== 'object') {
      return;
    }
    if (message.action === null || message.action === undefined) {
      return;
    }
    // iterate all listeners
    var i, l, keepChannel = false;
    for (i = 0; i < this._listeners.length; ++i) {
      l = this._listeners[i];
      // this is the message handler we want
      if (l.action === null || l.action === message.action) {
        if (l.callback(message, sendResponse) === true) {
          keepChannel = true;
        }
      }
    }
    return keepChannel;
  };

  /**
   * Add a message handler
   * 
   * @param {String}   action Optional, omit to listen all messages
   * @param {Function} callback
   */
  ResourceItem.prototype.addMessageListener = function (action, callback) {
    // allow to listen all messages if action is omitted
    if (typeof action === 'function') {
      callback = action;
      action = null;
    }
    if (this._listeners === undefined) {
      this._listeners = [];
    }
    this._listeners.push({
      action: action,
      callback: callback
    });
  };

  /**
   * A template class for handling general resource item
   * tasks of a node resource.
   *
   * @class
   * @augments ResourceItem
   */
  var NodeResourceItem = function () {
    this.addMessageListeners();
  };
  NodeResourceItem.prototype = Object.create(ResourceItem.prototype);

  /**
   * Set the node of the resource
   * @param {Node} node
   */
  NodeResourceItem.prototype.setNode = function (node) {
    this.node = node;
  };

  /**
   * Get the node of the resource
   * @return {Node}
   */
  NodeResourceItem.prototype.getNode = function () {
    return this.node;
  };

  /**
   * Add message listeners
   */
  NodeResourceItem.prototype.addMessageListeners = function () {
    this.addMessageListener('posting/internal/resourceDestroyed', this.onResourceDestroyed.bind(this));
  };

  /**
   * When the resource is destroyed
   */
  NodeResourceItem.prototype.onResourceDestroyed = function () {
    this.destroy();
  };

  /**
   * Remove the node from the DOM tree and detach
   * the resource item from the resource object.
   */
  NodeResourceItem.prototype.destroy = function () {
    if (this.node && this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }
    if (this.resource) {
      this.resource.removeInstanceByNode(this.node);
    }
  };

  /**
   * Whether the node is in DOM tree
   *
   * @override
   * @return {Boolean}
   */
  NodeResourceItem.prototype.isValid = function () {
    return document.body.contains(this.node);
  };

  // Expose to global
  SeamlessPosting.Resource = Resource;
  SeamlessPosting.resource = resource;

  SeamlessPosting.ResourceItem = ResourceItem;
  SeamlessPosting.NodeResourceItem = NodeResourceItem;

}());
