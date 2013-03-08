/**
 * @fileOverview This file provides for the button that determines the
 * operatin mode of the content script privly.js.
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
 * Toggles operating mode by changing the browserAction button and
 * updating the privly.js content script.
 *
 * @param {tab} tab The tab that is active when the user clicks the modal
 * button.
 * @param {function} callback The function to execute before the return
 * statement.
 *
 */
function modalButtonCallback(tab, callback) {
  
  //get the current value of the button by its badge text.
  chrome.browserAction.getBadgeText({},
    function(currentText) {
      
      //toggle the on/off state of the button
      if (currentText === "off") {
        
        // Set the text color to green
        chrome.browserAction.setBadgeBackgroundColor({color: "#004F00"});
        chrome.browserAction.setBadgeText({text: "on"});
        chrome.browserAction.setTitle({title: "Turn Privly Viewing Off"});
      } else {
        
        // Set the text color to red
        chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
        chrome.browserAction.setBadgeText({text: "off"});
        chrome.browserAction.setTitle({title: "Turn Privly Viewing On"});
        
      }
      
      //defined in reading_process.js
      tabChange(tab);
      
      if (callback !== undefined)
        callback();
    });
}

// Set the text color to green on the modal button
chrome.browserAction.setBadgeBackgroundColor({color: "#004F00"});

// Set the text on the modal button to "on"
chrome.browserAction.setBadgeText({text: "on"});

// When the icon is clicked, toggle the mode and notify the content scripts
chrome.browserAction.onClicked.addListener(modalButtonCallback);