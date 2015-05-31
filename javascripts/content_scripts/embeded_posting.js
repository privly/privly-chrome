/**
 *
 * This content script provides embed posting Privly message feature.
 *
 * This content script responds to following messages from background script:
 *
 *    embeded/onContextMenuClicked
 *        Restrict: editable element frame content script only
 *        Parameters:
 *          {String} frameUrl: The URL of the frame that should receive this message
 *
 *        This message is sent when user clicks the Privly context menu.
 *        Embed posting dialog will be opened.
 *    
 *    embeded/openPostDialog
 *        Restrict: top frame content script only
 *        
 *        Create an iframe to show embed posting dialog.
 *
 *    embeded/closePostDialog
 *        Restrict: top frame content script only
 *        
 *        Destroy the embed posting dialog iframe.
 *
 *    embeded/onLoginClosed
 *        Restrict: top frame content script only
 *
 *        Reload the embed posting dialog iframe to refresh login status.
 *        We will get this message when user successfully logged in from
 *        the window we poped up. Closing login window by user or log in
 *        from other window will not trigger this message.
 *
 *    embeded/getFormInfo
 *        Restrict: editable element frame content script only
 *        Respond: {Object}
 *          {Boolean} hasSubmitButton: Whether the form has a submit button
 *          {String} submitButtonText: Caption of the button if it exists
 *
 *        Get form information.
 *
 *    embeded/insertLink
 *        Restrict: editable element frame content script only
 *        Parameters:
 *          {String} link: The link to insert into the editable element
 *        Respond: {Boolean} Whether the insertion is successful
 *          
 *        Insert the link into the editable element.
 *
 *    embeded/submit
 *        Restrict: editable element frame content script only
 *
 *        Trigger click event of the submit button if exists.
 *
 *    embeded/emitEnterEvent:
 *        Restrict: editable element frame content script only
 *        Parameters:
 *          {Object} keys: Modifier keys
 *            {Boolean} ctrl
 *            {Boolean} shift
 *            {Boolean} alt
 *            {Boolean} meta
 *
 *        Emulate pressing ENTER key in the editable element with the given modifier keys.
 *
 *    embeded/getTargetContent:
 *        Restrict: editable element frame content script only
 *        Respond: {String} For textarea elements, this property contains its value.
 *                          For contentEditable elements, this property contains its innerHTML.
 *
 *        Get the content of the editable element.
 *        For textarea elements, it returns its value.
 *        For contentEditable elements, it returns its innerHTML.
 *
 *    embeded/setTargetContent:
 *        Restrict: editable element frame content script only
 *        Parameters:
 *          {String} content: The value (textarea) or innerHTML (contentEditable)
 *
 *        Set the content of the editable element.
 *        For textarea elements, it sets its value based on content parameter.
 *        For contentEditable elements, it sets its innerHTML based on content parameter.
 *
 *    embeded/focusTarget:
 *        Restrict: editable element frame content script only
 *
 *        Set focus on the editable element.
 * 
 */

/*global chrome:false, window:false */

var privlyPosting = {
  /**
   * Whether the posting dialog is opened in the content of this script.
   * Notice: Posting dialog will be poped up in the top frame
   * 
   * @type {Boolean}
   */
  isDialogOpen: false,

  /**
   * Whether the frame of the content script contains the editable element
   * 
   * @type {Boolean}
   */
  isTargetFrame: false,

  /**
   * The editable element to receive Privly URL
   * @type {Element}
   */
  urlReceiptNode: null,

  /**
   * The element that acts as a submiting button in the form of the editable element
   * 
   * @type {Element}
   */
  submitButtonNode: null,

  /**
   * Set the receipt node and try to find the submit button
   * of the form of the editable element.
   *
   * @param {Element} node The recipt node
   */
  setReceiptNode: function (node) {
    privlyPosting.urlReceiptNode = node;

    // starting to collect form information:
    // find the closest FORM element
    var formNode = node;
    while (formNode.parentNode) {
      formNode = formNode.parentNode;
      if (formNode.nodeName === 'FORM') {
        break;
      }
    }

    var submitNode = null;
    if (formNode.nodeName === 'FORM') {
      // we found a wrapping FORM element, try to find [type="submit"]
      var button = formNode.querySelector('button[type="submit"], input[type="submit"]');
      if (button) {
        submitNode = button;
      }
    }

    if (submitNode) {
      privlyPosting.submitButtonNode = submitNode;
    } else {
      privlyPosting.submitButtonNode = null;
      // The editable element isn't wrapped in a FORM element, or submit button not found
      // In this case, the poped up posting dialog will show a 'Done' button.
    }
  }
};

(function () {

  // Record the element that fires the context menu event.
  // This node will be used as the target editable element
  // if user clicks Privly menu items.
  // See background_scripts/posting_process.js for details.
  document.addEventListener("contextmenu", function (evt) {
    privlyPosting.setReceiptNode(evt.target);
  });

  /** 
   * The counter for uniquely marking the target element when executing scripts on the host page.
   * 
   * @type {Number}
   */
  var injectedIdentifier = 0;

  /**
   * Dispatch keyboard event on the target by using executing inline <script>.
   * 
   * Due to Chrome sandbox issues, we can't fire a keyboard event with correct charCode and keyCode
   * to the target in the content script.
   *
   * This workaround execute the script that fires the keyboard event in the context of the host page,
   * which can carry correct charCode and keyCode.
   *
   * This workaround is inspired and modified from:
   * http://stackoverflow.com/questions/13987380/how-to-to-initialize-keyboard-event-with-given-char-keycode-in-a-chrome-extensio
   * 
   * @param  {Element} target The element to fire the keyboard event
   * @param  {String} eventType The type of the keyboard event
   * @param  {Number} charCode charCode
   * @param  {Object} modifierKeys { ctrl, shift, alt, meta } Modifier keys of the keyboard event
   */
  function dispatchInjectedKeyboardEvent(target, eventType, charCode, modifierKeys) {
    // generate a identifier to access the element later in the context of the host page
    var attribute = 'privly_' + (++injectedIdentifier).toString(16);
    target.setAttribute(attribute, '');

    var selector = target.tagName + '[' + attribute + ']';

    // prepare to run in-page script
    var s = document.createElement('script');
    s.textContent = '(' + (function (eventType, charCode, modifierKeys, attribute, selector) {
      if (modifierKeys === undefined) {
        modifierKeys = {};
      }

      var element = document.querySelector(selector);
      element.removeAttribute(attribute);

      var evt = document.createEvent('Events');
      if (evt.initEvent) {
        evt.initEvent(eventType, true, true);
      }
      evt.ctrlKey = modifierKeys.ctrl || false;
      evt.altKey = modifierKeys.alt || false;
      evt.shiftKey = modifierKeys.shift || false;
      evt.metaKey = modifierKeys.meta || false;
      evt.charCode = charCode;
      evt.keyCode = charCode;
      evt.which = charCode;

      element.dispatchEvent(evt);

    }).toString() + ')(' + [eventType, charCode, modifierKeys, attribute, selector].map(function (v) {
      if (v === undefined) {
        return 'undefined';
      }
      return JSON.stringify(v);
    }).join(', ') + ')';

    // execute script
    (document.head || document.documentElement).appendChild(s);
    s.parentNode.removeChild(s);
  }

  /**
   * Dispatch text event on the target.
   * Expect to fire textInput event.
   * 
   * @param  {Element} target The element to fire the text event
   * @param  {String} eventType The type of the text event
   * @param  {String} char The content of the text event (can be a string)
   */
  function dispatchTextEvent(target, eventType, char) {
    var evt = document.createEvent("TextEvent");
    evt.initTextEvent(eventType, true, true, window, char, 0, "en-US");
    target.dispatchEvent(evt);
  }

  /**
   * Dispatch mouse event on the target.
   * Expect to fire click event.
   * 
   * @param  {Element} target The element to fire the mouse event
   * @param  {String} eventType The type of the mouse event
   */
  function dispatchMouseEvent(target, eventType) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent(eventType, true, true, window,
      1, 0, 0, 0, 0, false, false, false, false, 0, null);
    target.dispatchEvent(evt);
  }

  /**
   * Place the URL into the host page and fire
   * the appropriate events to get the host page
   * to process the link.
   * 
   * @param  {String} url The URL to insert into the editable element
   */
  function receiveURL(url) {
    // For efficiency, we directly insert all characters at once.
    dispatchTextEvent(privlyPosting.urlReceiptNode, "textInput", url);

    // Then we emulate inputing a space
    var ch = ' ';
    var chCode = ch.charCodeAt(0);
    dispatchInjectedKeyboardEvent(privlyPosting.urlReceiptNode, "keydown", chCode);
    dispatchInjectedKeyboardEvent(privlyPosting.urlReceiptNode, "keypress", chCode);
    dispatchTextEvent(privlyPosting.urlReceiptNode, "textInput", ch);
    dispatchInjectedKeyboardEvent(privlyPosting.urlReceiptNode, "keyup", chCode);
  }

  /**
   * Provides functions related to embed posting.
   * @type {Object}
   */
  var embedPosting = {

    /**
     * The iframe element that renders embed posting page.
     * @type {Element}
     */
    iframe: null,

    /**
     * Open the embed posting dialog.
     * This function creates an iframe on the host page to render the dialog.
     */
    open: function () {
      if (privlyPosting.isDialogOpen) {
        return false;
      }
      privlyPosting.isDialogOpen = true;

      this.iframe = document.createElement("iframe");
      var attrs = {
        "frameborder": "0",
        "scrolling": "yes",
        "data-privly-exclude": "true",
        "src": chrome.extension.getURL("privly-applications/Message/embeded.html")
      };
      var key;
      for (key in attrs) {
        this.iframe.setAttribute(key, attrs[key]);
      }
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.position = 'fixed';
      this.iframe.style.left = '0';
      this.iframe.style.top = '0';
      this.iframe.style.zIndex = '2147483647';
      document.body.appendChild(this.iframe);

      return true;
    },

    /**
     * Close seamless posting dialog.
     * This function destroys the iframe that renders the dialog.
     */
    close: function () {
      if (!privlyPosting.isDialogOpen) {
        return;
      }
      document.body.removeChild(this.iframe);
      this.iframe = null;
      privlyPosting.isDialogOpen = false;
    },

    /**
     * Reload seamless posting dialog.
     * May be called after user logged in.
     * 
     * This function refreshes the iframe that renders the dialog.
     */
    reload: function () {
      if (!privlyPosting.isDialogOpen) {
        return;
      }
      this.iframe.src += ''; // reload the iframe
    },

    /**
     * Whether there is a submit button and returns its caption if exists.
     *
     * @todo support HTML5 form attribute
     * 
     * @return {Object}
     *    {Boolean} hasSubmitButton: Whether the form has a submit button
     *    {String} submitButtonText: Caption of the button if it exists
     */
    getFormInfo: function () {
      if (!privlyPosting.isTargetFrame) {
        return false;
      }
      if (!privlyPosting.submitButtonNode || !document.contains(privlyPosting.submitButtonNode)) {
        return {
          hasSubmitButton: false
        };
      }
      var btnText;
      if (privlyPosting.submitButtonNode.nodeName === 'INPUT') {
        btnText = privlyPosting.submitButtonNode.value;
      } else {
        btnText = privlyPosting.submitButtonNode.innerText;
      }
      return {
        hasSubmitButton: true,
        submitButtonText: btnText
      };
    },

    /**
     * Insert Privly link to the editable element.
     * 
     * @param  {String} link The link to insert to.
     * @return {Boolean} Whether the operation is successful.
     */
    insertLink: function (link) {
      if (!privlyPosting.isTargetFrame) {
        return false;
      }
      if (!document.contains(privlyPosting.urlReceiptNode)) {
        return false;
      }
      receiveURL(link);
      return true;
    },

    /**
     * Submit the form of the editable element by
     * emulating clicking the submitting button.
     * 
     * @return {Boolean} Whether the operation is successful.
     */
    submit: function () {
      if (!privlyPosting.isTargetFrame) {
        return false;
      }
      if (!privlyPosting.submitButtonNode) {
        return false;
      }
      if (!document.contains(privlyPosting.submitButtonNode)) {
        return false;
      }
      dispatchMouseEvent(privlyPosting.submitButtonNode, "click");
      return true;
    },

    /**
     * Dispatch enter key on the editable element.
     * 
     * @param  {Object} keys Modifier keys
     *     {Boolean} ctrl
     *     {Boolean} shift
     *     {Boolean} alt
     *     {Boolean} meta
     * @return {Boolean} Whether the operation is successful.
     */
    keyEnter: function (keys) {
      if (!privlyPosting.isTargetFrame) {
        return false;
      }
      if (!privlyPosting.urlReceiptNode) {
        return false;
      }
      if (!document.contains(privlyPosting.urlReceiptNode)) {
        return false;
      }
      dispatchInjectedKeyboardEvent(privlyPosting.urlReceiptNode, "keydown", 13, keys);
      dispatchInjectedKeyboardEvent(privlyPosting.urlReceiptNode, "keypress", 13, keys);
      dispatchInjectedKeyboardEvent(privlyPosting.urlReceiptNode, "keyup", 13, keys);
      return true;
    },

    /**
     * Get the content of the editable element.
     * For textarea elements, it returns its value.
     * For contentEditable elements, it returns its innerHTML.
     *
     * If the target doesn't exist, this function returns false.
     *
     * @return {String} For textarea elements, this property contains its value.
     *                  For contentEditable elements, this property contains its innerHTML.
     */
    getTargetContent: function () {
      if (!privlyPosting.isTargetFrame) {
        return false;
      }
      if (!privlyPosting.urlReceiptNode) {
        return false;
      }
      if (!document.contains(privlyPosting.urlReceiptNode)) {
        return false;
      }
      if (privlyPosting.urlReceiptNode.nodeName === 'TEXTAREA') {
        return privlyPosting.urlReceiptNode.value;
      } else {
        return privlyPosting.urlReceiptNode.innerHTML;
      }
    },

    /**
     * Set the content of the editable element.
     * For textarea elements, it sets its value based on content parameter.
     * For contentEditable elements, it sets its innerHTML based on content parameter.
     *
     * @param {String} content The value (textarea) or innerHTML (contentEditable) to set as the content
     *
     * @return {Boolean} Whether the operation is successful.
     */
    setTargetContent: function (content) {
      if (!privlyPosting.isTargetFrame) {
        return false;
      }
      if (!privlyPosting.urlReceiptNode) {
        return false;
      }
      if (!document.contains(privlyPosting.urlReceiptNode)) {
        return false;
      }
      if (privlyPosting.urlReceiptNode.nodeName === 'TEXTAREA') {
        privlyPosting.urlReceiptNode.value = content;
      } else {
        privlyPosting.urlReceiptNode.innerHTML = content;
      }
      return true;
    },

    /**
     * Focus the editable element.
     *
     * @return {Boolean} Whether the operation is successful.
     */
    focusTarget: function () {
      if (!privlyPosting.isTargetFrame) {
        return false;
      }
      if (!privlyPosting.urlReceiptNode) {
        return false;
      }
      if (!document.contains(privlyPosting.urlReceiptNode)) {
        return false;
      }
      privlyPosting.urlReceiptNode.focus();
      return true;
    }
  };

  // Receive messages from background script
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.target === 'topframe') {
      // We expect the top frame content script to receive this message
      try {
        if (window.frameElement) {
          return;
        }
      } catch (e) {
        // Security Error, caused by cross domain iframe accessing
        // Then definitely we are in an iframe
        return;
      }
    } else if (request.target === 'nodeframe') {
      // We expect the editable element frame content script to receive this message
      if (!privlyPosting.isTargetFrame) {
        return;
      }
    }

    var success, info, content;

    switch (request.action) {
    case 'embeded/onContextMenuClicked':
      if (!request.frameUrl || window.location.href === request.frameUrl) {
        chrome.runtime.sendMessage({ask: 'embeded/openPostDialog'}, function (success) {
          if (success) {
            privlyPosting.isTargetFrame = true;
          }
        });
      }
      break;
    case 'embeded/openPostDialog':
      success = embedPosting.open();
      sendResponse(success);
      break;
    case 'embeded/closePostDialog':
      embedPosting.close();
      break;
    case 'embeded/onLoginClosed':
      embedPosting.reload();
      break;
    case 'embeded/getFormInfo':
      info = embedPosting.getFormInfo();
      sendResponse(info);
      break;
    case 'embeded/insertLink':
      success = embedPosting.insertLink(request.link);
      sendResponse(success);
      break;
    case 'embeded/submit':
      embedPosting.submit();
      break;
    case 'embeded/emitEnterEvent':
      embedPosting.keyEnter(request.keys);
      break;
    case 'embeded/getTargetContent':
      content = embedPosting.getTargetContent();
      sendResponse(content);
      break;
    case 'embeded/setTargetContent':
      embedPosting.setTargetContent(request.content);
      break;
    case 'embeded/focusTarget':
      embedPosting.focusTarget();
      break;
    }
  });

}());
