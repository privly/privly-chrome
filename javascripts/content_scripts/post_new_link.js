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

  sendButtonInfo: function() {
    if (!privlyPosting.pendingPost) {
      return;
    }
    this.iframe.contentWindow.postMessage({
      type: 'submitButton',
      submit: privlyPosting.submitButtonNode ? true : false
    }, '*');
  },

  insertLink: function(link) {
    if (!privlyPosting.pendingPost) {
      return;
    }
    receiveURL(link, (function() {
      this.iframe.contentWindow.postMessage({
        type: 'insertLinkDone'
      }, '*');
    }).bind(this));
    /*
    // drop the Privly URL into the form element
    if ( request.privlyUrl !== undefined &&
         privlyPosting.urlReceiptNode !== undefined &&
         privlyPosting.pendingPost) {
      receiveURL(request, sender, sendResponse);
    }

    // It will not change the posting location until the last post completes
    // background.js can cancel the last pendingPost by messaging
    // pendingPost: false
    if(request.pendingPost !== undefined) {
      privlyPosting.pendingPost = request.pendingPost;
    }*/
  }
};

/**
 * Place the URL into the host page and fire
 * the appropriate events to get the host page
 * to process the link.
 */
var receiveURL = (function() {
  // Three functions that dispatch special events needed for the correct 
  // insertion of the privlyURL text inside the form after it is received
  function dispatchTextEvent(target, eventType, char) {
     var evt = document.createEvent("TextEvent");    
     evt.initTextEvent(eventType, true, true, window, char, 0, "en-US");
     target.dispatchEvent(evt);
  }
   
  function dispatchKeyboardEvent(target, eventType, char) {
     var evt = document.createEvent("KeyboardEvent");    
     evt.initKeyboardEvent(eventType, true, true, window,
       false, false, false, false,
       0, char);
     target.dispatchEvent(evt);
  }

  function dispatchClickEvent(target, eventType) {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent(eventType, true, true, window,
      1, 0, 0, 0, 0, false, false, false, false, 0, null);
    target.dispatchEvent(evt);
  }

  return function(url, callback) {
    // Focus the DOM Node
    privlyPosting.urlReceiptNode.focus();

    dispatchClickEvent(privlyPosting.urlReceiptNode, "click");

    // Some sites need time to execute form initialization
    // callbacks following focus and keydown events.
    // One example includes Facebook.com's wall update
    // form and message page.
    setTimeout(function () {

      // simulate every character of the URL as a keypress and 
      // dispatch for it 'keydown', 'keypress', 'textInput' and 'keyup' events
      for(var i = 0; i < url.length; i++) {
        var currentChar = url.charAt(i); 

        dispatchKeyboardEvent(privlyPosting.urlReceiptNode, "keydown", currentChar);
        dispatchKeyboardEvent(privlyPosting.urlReceiptNode, "keypress", currentChar);
        dispatchTextEvent(privlyPosting.urlReceiptNode, "textInput", currentChar);
        dispatchKeyboardEvent(privlyPosting.urlReceiptNode, "keyup", currentChar);
      }

      callback && callback();
      //privlyPosting.urlReceiptNode = undefined;
      //privlyPosting.pendingPost = false;

    }, 200);
  }
}());

// We only accept messages from background.js,
// to ensure that host page cannot forge a message to us.
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
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
  }
});


}());
