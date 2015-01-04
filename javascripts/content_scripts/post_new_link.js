//
// Host Page Code
//
// This section is for managing the selection form elements and posting of
// Privly-type links to those form elements.
//
// The script follows this flow of events
// 1. When the user right clicks the page it fires the contextmenu event
// 2. The script records the target node
// 3. If the user selects the context menu for Privly, posting_process.js
// sends a message to this script to freeze posting. This prevents future
// right clicks from changing the destination node.
// 4. Finally, background.js will message this script the Privly URL
// to drop into the original form element.
//

// Where the Privly URL will be placed is remembered by the contextmenu event
// or the click event on the button
// var privlyUrlReceiptNode = undefined;    //implicitely all javascript variables are initialized to undefined.

/*global privlyUrlReceiptNode:false, chrome:false, ls:true,  */

// Variable used to indicate whether there is a pending pending operation
var pendingPost = false;

document.addEventListener( "contextmenu", function(evt) {
  if (!pendingPost) {
    privlyUrlReceiptNode = evt.target;
  }
});

// Three functions that dispatch special events needed for the correct 
// insertion of the privlyURL text inside the form after it is received
function dispatchTextEvent(target, eventType, char) {
   var evt = document.createEvent("TextEvent");    
   evt.initTextEvent (eventType, true, true, window, char, 0, "en-US");
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

/**
 * Place the URL into the host page and fire
 * the appropriate events to get the host page
 * to process the link.
 *
 * @param request json the JSON document sent as part of the message.
 * @param sender tab the tab sending the message.
 * @param sendResponse function the response function is the
 * callback defined by the function sending the message here
 *
 */
function receiveURL(request, sender, sendResponse) {

  // Focus the DOM Node
  privlyUrlReceiptNode.focus();

  dispatchClickEvent(privlyUrlReceiptNode, "click");

  // Some sites need time to execute form initialization
  // callbacks following focus and keydown events.
  // One example includes Facebook.com's wall update
  // form and message page.
  setTimeout(function () {

    // simulate every character of the URL as a keypress and 
    // dispatch for it 'keydown', 'keypress', 'textInput' and 'keyup' events
    for(var i = 0; i < request.privlyUrl.length; i++) {
      var currentChar = request.privlyUrl.charAt(i); 

      dispatchKeyboardEvent(privlyUrlReceiptNode, "keydown", currentChar);
      dispatchKeyboardEvent(privlyUrlReceiptNode, "keypress", currentChar);
      dispatchTextEvent(privlyUrlReceiptNode, "textInput", currentChar);
      dispatchKeyboardEvent(privlyUrlReceiptNode, "keyup", currentChar);
    }

    privlyUrlReceiptNode = undefined;
    pendingPost = false;

  }, 200);
}

// Accepts Privly URL from the background.js script
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {

    // drop the Privly URL into the form element
    if ( request.privlyUrl !== undefined &&
         privlyUrlReceiptNode !== undefined &&
         pendingPost) {
      receiveURL(request, sender, sendResponse);
    }

    // It will not change the posting location until the last post completes
    // background.js can cancel the last pendingPost by messaging
    // pendingPost: false
    if(request.pendingPost !== undefined) {
      pendingPost = request.pendingPost;
    }
  }
);
