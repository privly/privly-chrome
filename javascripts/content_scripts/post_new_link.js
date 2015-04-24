/*global privlyPosting:false, chrome:false, ls:true,  */

/**
 * This content-script handles posting Privly message on host page.
 *
 * 1. record ContextMenu target node
 *    1. When the user right clicks the page it fires the contextmenu event
 *    2. The script records the target node
 *    3. If the user selects the context menu for Privly, posting_process.js
 *    sends a message to this script to freeze posting. This prevents future
 *    right clicks from changing the destination node.
 *    4. Finally, background.js will message this script the Privly URL
 *    to drop into the original form element.
 *
 * 2. provide interface to drop Privly URL to a node
 *
 * 3. manage posting status
 *    - the target node
 *    - are there any pending posting
 *
 * 4. provide interface to initialize a posting progress
 *
 * Note: The posting-button is specially implemented in posting_button.js.
 */

/*global privlyPosting:false, chrome:false, ls:true,  */

var privlyPosting = {
  urlReceiptNode: null,   // The editableElement to receive Privly URL
  submitButtonNode: null, // The node of [type="submit"]
  pendingPost: false,     // Whether there is a pending pending operation

  /**
   * Set the receipt node.
   * We also collect form data here (whether there is a submit button)
   */
  setReceiptNode: function(node) {
    privlyPosting.urlReceiptNode = node;

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
      var button = formNode.querySelector('[type="submit"]');
      if (button) {
        submitNode = button;
      }
    }

    if (submitNode) {
      privlyPosting.submitButtonNode = submitNode;
    } else {
      privlyPosting.submitButtonNode = null;
      // the editableElement isn't wrapped in a FORM element,
      // or submit button not found: show 'Done' button.
    }
  }
};

(function() {

var injectedIdentifier = 0;

function dispatchInjectedKeyboardEvent(target, eventType, charCode, options) {
  // Modified from:
  // http://stackoverflow.com/questions/13987380/how-to-to-initialize-keyboard-event-with-given-char-keycode-in-a-chrome-extensio
  
  // generate a identifier to access the element
  var attribute = 'privly_' + (++injectedIdentifier).toString(16);
  target.setAttribute(attribute, '');

  var selector = target.tagName + '[' + attribute + ']';

  // prepare to run in-page script
  var s = document.createElement('script');
  s.textContent = '(' + function(eventType, charCode, options, attribute, selector) {
    
    var target = document.querySelector(selector);
    target.removeAttribute(attribute);

    var evt = document.createEvent('Events');
    if (evt.initEvent) {
      evt.initEvent(eventType, true, true);
    }
    evt.ctrlKey = options.ctrl || false;
    evt.altKey = options.alt || false;
    evt.shiftKey = options.shift || false;
    evt.metaKey = options.meta || false;
    evt.charCode = charCode;
    evt.keyCode = charCode;
    evt.which = charCode;
  
    target.dispatchEvent(evt);

  } + ')(' + [eventType, charCode, options, attribute, selector].map(function(v) {
    return JSON.stringify(v);
  }).join(', ') + ')';
  
  // execute script
  (document.head || document.documentElement).appendChild(s);
  s.parentNode.removeChild(s);
}

function dispatchTextEvent(target, eventType, char) {
  var evt = document.createEvent("TextEvent");    
  evt.initTextEvent(eventType, true, true, window, char, 0, "en-US");
  target.dispatchEvent(evt);
}

function dispatchClickEvent(target, eventType) {
  var evt = document.createEvent("MouseEvents");
  evt.initMouseEvent(eventType, true, true, window,
    1, 0, 0, 0, 0, false, false, false, false, 0, null);
  target.dispatchEvent(evt);
}

// record contextmenu target node 
document.addEventListener("contextmenu", function(evt) {
  if (!privlyPosting.pendingPost) {
    privlyPosting.setReceiptNode(evt.target);
  }
});

// seamless posting
var seamlessPosting = {

  iframe: null,

  /**
   * Open seamless posting dialog
   */
  open: function() {
    if (privlyPosting.pendingPost) {
      return;
    }
    privlyPosting.pendingPost = true;

    this.iframe = document.createElement("iframe");
    var attrs = {
      "frameborder": "0",
      "style": "width: 100%; height: 100%; position: fixed; left: 0; top: 0; z-index: 2147483647;",
      "scrolling": "yes",
      "data-privly-exclude": "true",
      "src": chrome.extension.getURL("privly-applications/Message/new_embed.html")
    };
    for (var key in attrs) {
      this.iframe.setAttribute(key, attrs[key]);
    }
    document.body.appendChild(this.iframe);
  },

  /**
   * Close seamless posting dialog
   */
  close: function() {
    if (!privlyPosting.pendingPost) {
      return;
    }
    document.body.removeChild(this.iframe);
    this.iframe = null;
    privlyPosting.pendingPost = false;
  },

  /**
   * Reload seamless posting dialog
   */
  reload: function() {
    if (!privlyPosting.pendingPost) {
      return;
    }
    this.iframe.src += ''; // reload the iframe
  },

  /**
   * Tell dialog whether to show submit button
   */
  sendButtonInfo: function() {
    if (!privlyPosting.pendingPost) {
      return;
    }
    this.iframe.contentWindow.postMessage({
      type: 'submitButton',
      submit: privlyPosting.submitButtonNode ? true : false
    }, '*');
  },

  /**
   * Insert Privly link to original editable element
   */
  insertLink: function(link) {
    if (!privlyPosting.pendingPost) {
      return;
    }
    receiveURL(link, (function() {
      this.iframe.contentWindow.postMessage({
        type: 'insertLinkDone'
      }, '*');
    }).bind(this));
  },

  /**
   * Submit the original form
   */
  submit: function() {
    if (!privlyPosting.pendingPost) {
      return;
    }
    if (!privlyPosting.submitButtonNode) {
      return;
    }
    dispatchClickEvent(privlyPosting.submitButtonNode, "click");
  },

  /**
   * Dispatch enter key
   */
  keyEnter: function(keys) {
    if (!privlyPosting.pendingPost) {
      return;
    }
    dispatchInjectedKeyboardEvent(privlyPosting.urlReceiptNode, "keydown", 13, keys);
    dispatchInjectedKeyboardEvent(privlyPosting.urlReceiptNode, "keypress", 13, keys);
    dispatchInjectedKeyboardEvent(privlyPosting.urlReceiptNode, "keyup", 13, keys);
  }
};

/**
 * Place the URL into the host page and fire
 * the appropriate events to get the host page
 * to process the link.
 */
function receiveURL(url, callback) {
  dispatchTextEvent(privlyPosting.urlReceiptNode, "textInput", url);
  callback && callback();
}

// We only accept messages from background.js
// to handle messages in one place.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // TODO: support embed iframe currently.
  if (window.frameElement) {
    return;
  }
  switch(request.action) {
    case 'posting/close_login':
      seamlessPosting.reload();
      break;
    case 'posting/new_post':
      seamlessPosting.open();
      break;
    case 'posting/close_post':
      seamlessPosting.close();
      break;
    case 'posting/ready':
      seamlessPosting.sendButtonInfo();
      break;
    case 'posting/insert_link':
      seamlessPosting.insertLink(request.link);
      break;
    case 'posting/submit':
      seamlessPosting.submit();
      break;
    case 'posting/keyEnter':
      seamlessPosting.keyEnter(request.keys);
      break;
  }
});


}());
