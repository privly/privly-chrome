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
 */

/**
 * @namespace for the modal button.
 */
var modalButton = {

  /**
   * Gives the current state of the modal button. This is provided so that
   * an assynchronous call to getBadgeText is not necessary.
   */
  badgeText: "on",


  /**
   * Handles when the popup.js script sends a command to change the
   * operating mode of the content script. This message handler
   * is selected with a message "modeChange".
   *
   * @param {object} request An object containing the message body.
   * @param {object} sender The scripting context that sent the message.
   * @param {function} sendResponse The sender can send a function that
   * will return a message.
   */
  modeChange: function(request, sender, sendResponse) {
    if( request.handler === "modeChange" ) {
      if( modalButton.badgeText === "on") {
        modalButton.badgeText = "off";
      } else {
        modalButton.badgeText = "on";
      }
      chrome.tabs.query({currentWindow:true, highlighted: true}, readingProcess.tabsChange);
      sendResponse();
    }
  }
};


// Set the text color to green on the modal button
chrome.browserAction.setBadgeBackgroundColor({color: "#004F00"});

// Set the text on the modal button to "on"
chrome.browserAction.setBadgeText({text: "on"});

// Handles the receipt of Privly URLs for addition to the web page.
// The request object should contain the privlyUrl.
chrome.extension.onMessage.addListener(modalButton.modeChange);
