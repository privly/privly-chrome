/**
 * @fileOverview This file initializes the modal button. This includes
 * initializing the button's state on browser start and interfacing with
 * the reading_process.js so the links will toggle their injection.
 * Changes to the modal button are also made by the popup.html
 * page which provides some controls and links for the extension.
 *
 * The text message on the button determines the operating mode.
 * "off" indicates that the content script can be injected, but it
 * doesn't execute any code.
 *
 * "on" indicates that the content script is injected, and should
 * actively replace links on the user's whitelist.
 *
 * This file depends on the tabChange function defined in reading_process.js
 *
 */

/**
 * Gives the current state of the modal button. This is provided so that 
 * an assynchronous call to getBadgeText is not necessary.
 */
var badgeText = "on";

// Set the text color to green on the modal button
chrome.browserAction.setBadgeBackgroundColor({color: "#004F00"});

// Set the text on the modal button to "on"
chrome.browserAction.setBadgeText({text: "on"});

/**
 * Handles when the popup.js script sends a command to change the
 * operating mode of the content script. This message handler
 * is selected with a message "modeChange".
 */
function modeChange(request, sender, sendResponse) {
  if( request.handler === "modeChange" ) {
    if( badgeText === "on") {
      badgeText = "off";
    } else {
      badgeText = "on";
    }
    chrome.tabs.query({currentWindow:true, highlighted: true}, tabsChange)
  }
}

// Handles the receipt of Privly URLs for addition to the web page.
// The request object should contain the privlyUrl.
chrome.extension.onMessage.addListener(modeChange);
