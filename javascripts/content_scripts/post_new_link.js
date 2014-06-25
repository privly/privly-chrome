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


// Create a div to handle the privly button
var div = document.createElement("div");

div.style.position = "absolute";
div.style.zIndex = "999";
div.style.opacity = "0";

// The button is represented by this span element
var span = document.createElement("span");

span.style.background = "url(" + chrome.extension.getURL("images/logo_16.png") + ") no-repeat";
span.style.width = "16px";
span.style.height = "16px";
span.style.display = "block";
div.appendChild(span);

var context, offsets, width, active;

// Use JavaScript event delegation functionality to attach a click event to 
// every textarea and editable div on page
document.body.addEventListener( "click", function(evt) {
  if(evt.target && 
    (evt.target.nodeName == "TEXTAREA" || 
    (evt.target.nodeName == "DIV" && evt.target.getAttribute("contenteditable")))) {

    // The button can now be click-able
    span.style.cursor = "pointer";

    // Save the current context
    context = evt.target;

    active = true;

    evt.target.parentNode.style.position = "relative";
    evt.target.parentNode.insertBefore(div, evt.target);

    div.style.opacity = "0";

    // Not a perfect positioning of the button, especially in Twitter and G+
    offsets = evt.target.getBoundingClientRect();
    width = offsets.right - offsets.left;    
    div.style.top = "5px";
    div.style.left = (width - 15) + "px";

    div.style.transition = "opacity 0.3s ease-in";
    div.style.opacity = "0.55";

    // Make the button fade out after 3s
    setTimeout(function() {fadeOut()}, 3000);
  }
});

// Function that makes the button fade out
function fadeOut() {
  active = false;
  div.style.transition = "opacity 0.3s ease-out";
  div.style.opacity = "0";
  span.style.cursor = "auto";
}

// Where the Privly URL will be placed is remembered by the contextmenu event
// or the click event on the button
var privlyUrlReceiptNode = undefined;

document.addEventListener( "contextmenu", function(evt) {
  if (!pendingPost) {
    privlyUrlReceiptNode = evt.target;
  }
});

// Clicking the button will send a message to posting_process.js to create new
// Privly message using ZeroBin application
span.addEventListener( "click", function() {

  // Check if there is no pending post and if the button has been triggered
  // i.e. the opacity is 0.55
  if (active && !pendingPost &&  (getComputedStyle(div).getPropertyValue("opacity") > 0)) {
    chrome.runtime.sendMessage({ask: "newPost"}, function(response) {});
    privlyUrlReceiptNode = context;
  }
});

// Variable used to indicate whether there is a pending pending operation
var pendingPost = false;


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
    
  // Focus the DOM Node, then fire keydown and keypress events
  privlyUrlReceiptNode.focus();
  var keydownEvent = document.createEvent("KeyboardEvent"); 
  keydownEvent.initKeyboardEvent('keydown', true, true, window, 0, 
                          false, 0, false, 0, 0);
  privlyUrlReceiptNode.dispatchEvent(keydownEvent);
  var keypressEvent = document.createEvent("KeyboardEvent"); 
  keypressEvent.initKeyboardEvent('keypress', true, true, window, 0, 
                          false, 0, false, 0, 0); 
  privlyUrlReceiptNode.dispatchEvent(keypressEvent);
  
  // Some sites need time to execute form initialization 
  // callbacks following focus and keydown events.
  // One example includes Facebook.com's wall update
  // form and message page.
  setTimeout(function(){
    
    privlyUrlReceiptNode.value = request.privlyUrl;
    privlyUrlReceiptNode.textContent = request.privlyUrl;
    
    var event = document.createEvent("KeyboardEvent"); 
    event.initKeyboardEvent('keyup', true, true, window, 
                            0, false, 0, false, 0, 0); 
    privlyUrlReceiptNode.dispatchEvent(event);
    
    privlyUrlReceiptNode = undefined;
    pendingPost = false;
  },500);
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
