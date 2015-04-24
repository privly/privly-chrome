/*global privlyPosting:false, chrome:false, ls:true,  */

/**
 * TODO: outdated comment
 * 
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
  isDialogOpen: false,    // Whether the posting dialog is opened.
                          // Notice: Posting dialog will be poped up in the top frame
  isTargetFrame: false,   // Is this frame the target frame? (containing the target editableElement)

  urlReceiptNode: null,   // The editableElement to receive Privly URL
  submitButtonNode: null, // The node of [type="submit"]

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

var privlyScriptIdentifier = Math.random() * 0xFFFFFFFF + Date.now();

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
  privlyPosting.setReceiptNode(evt.target);
});

// seamless posting
var seamlessPosting = {

  iframe: null,

  /**
   * Open seamless posting dialog
   */
  open: function() {
    if (privlyPosting.isDialogOpen) {
      return false;
    }
    privlyPosting.isDialogOpen = true;

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

    return true;
  },

  /**
   * Close seamless posting dialog
   */
  close: function() {
    if (!privlyPosting.isDialogOpen) {
      return;
    }
    document.body.removeChild(this.iframe);
    this.iframe = null;
    privlyPosting.isDialogOpen = false;
  },

  /**
   * Reload seamless posting dialog
   */
  reload: function() {
    if (!privlyPosting.isDialogOpen) {
      return;
    }
    this.iframe.src += ''; // reload the iframe
  },

  /**
   * Tell dialog whether to show submit button
   */
  getFormInfo: function() {
    return {
      hasSubmitButton: privlyPosting.submitButtonNode ? true : false
    };
  },

  /**
   * Insert Privly link to original editable element
   */
  insertLink: function(link) {
    if (!privlyPosting.isTargetFrame) {
      return false;
    }
    receiveURL(link);
    return true;
  },

  /**
   * Submit the original form
   */
  submit: function() {
    if (!privlyPosting.isTargetFrame) {
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
    if (!privlyPosting.isTargetFrame) {
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
function receiveURL(url) {
  dispatchTextEvent(privlyPosting.urlReceiptNode, "textInput", url);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.target === 'topframe') {
    // We expect the content script of topFrame to receive this message
    if (window.frameElement) {
      return;
    }
  } else if (request.target === 'nodeframe') {
    // expect script host: the frame containing editableElement
    if (!privlyPosting.isTargetFrame) {
      return;
    }
  }

  switch(request.action) {
    case 'posting/on_context_menu_clicked':
      if (!request.frameUrl || window.location.href === request.frameUrl) {
        chrome.runtime.sendMessage({ask: "posting/open_post_dialog"}, function(success) {
          if (success) {
            privlyPosting.isTargetFrame = true;
          }
        });
      }
      break;
    case 'posting/open_post_dialog':
      var success = seamlessPosting.open();
      sendResponse(success);
      break;
    case 'posting/on_login_closed':
      seamlessPosting.reload();
      break;
    case 'posting/close_post_dialog':
      seamlessPosting.close();
      break;
    case 'posting/get_form_info':
      var info = seamlessPosting.getFormInfo();
      sendResponse(info);
      break;
    case 'posting/insert_link':
      seamlessPosting.insertLink(request.link);
      sendResponse();
      break;
    case 'posting/submit':
      seamlessPosting.submit();
      break;
    case 'posting/on_keypress_enter':
      seamlessPosting.keyEnter(request.keys);
      break;
  }
});


}());
