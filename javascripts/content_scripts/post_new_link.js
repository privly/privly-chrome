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
div.style.opacity = "0";
div.title = "New Privly message";

// The button is represented by this span element
var span = document.createElement("span");

span.style.background = "url(" + chrome.extension.getURL("images/logo_16.png") + ") no-repeat";
span.style.width = "16px";
span.style.height = "16px";
span.style.display = "block";
div.appendChild(span);

var active, hovered, timeout;
var context, parentOffsets, offsets, rightMargin, topMargin;

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
    div.style.zIndex = "999";
    div.style.opacity = "0";

    evt.target.parentNode.style.position = "relative";
    evt.target.parentNode.insertBefore(div, evt.target);    

    // Not a perfect positioning of the button, especially in G+
    parentOffsets = evt.target.parentNode.getBoundingClientRect();
    offsets = evt.target.getBoundingClientRect();

    topMargin = offsets.top - parentOffsets.top;
    rightMargin = parentOffsets.right - offsets.right;

    // Check if the height of the form is bigger then 21
    // 21px = 16px (logo) + 5px (desired margin)
    if(offsets.bottom - offsets.top > 21) {
      // If there is already a top margin bigger then 5px
      if(topMargin > 5) {
        div.style.top = topMargin + "px";
      } else {
        div.style.top = topMargin + +"5" + "px";
      }
    } else {
      if(topMargin > 5) {
        topMargin = 5;
      } else {
        topMargin = topMargin + 2;
      }
      div.style.top = topMargin + "px";
    }
    
    div.style.right = rightMargin + +"3" + "px";

    div.style.transition = "opacity 0.3s ease-in";
    div.style.opacity = "0.7";

    // Make the button fade out after 3s
    if(!hovered) {
      clearTimeout(timeout);
      timeout = setTimeout(function() {fadeOut()}, 3000);
    }
  }
});

// The button will not disappear while it is hovered
span.addEventListener( "mouseover", function(){    
    hovered = true;
    div.style.opacity = "1";
    clearTimeout(timeout);
  });

span.addEventListener( "mouseout", function(){
    hovered = false;
    div.style.opacity = "0.7";
    timeout = setTimeout(function() {fadeOut()}, 3000);
  });

// Function that makes the button fade out
function fadeOut() {
  div.style.transition = "opacity 0.3s ease-out";
  div.style.opacity = "0";
  active = false;

  // To allow the transition to happen, set the zIndex with a delay
  setTimeout(function() {div.style.zIndex = "-1";}, 200);  
}

// Clicking the button will send a message to posting_process.js to create new
// Privly message using ZeroBin application
span.addEventListener( "click", function() {

  // Check if there is no pending post and if the button has been triggered
  // i.e. the opacity is 0.7
  if (active && !pendingPost &&  (getComputedStyle(div).getPropertyValue("opacity") > 0)) {
    chrome.runtime.sendMessage({ask: "newPost"}, function(response) {});
    privlyUrlReceiptNode = context;
  } else {
    chrome.runtime.sendMessage({ask: "showNotification"}, function(response) {});
  }
});

// Where the Privly URL will be placed is remembered by the contextmenu event
// or the click event on the button
var privlyUrlReceiptNode = undefined;

document.addEventListener( "contextmenu", function(evt) {
  if (!pendingPost) {
    privlyUrlReceiptNode = evt.target;
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
