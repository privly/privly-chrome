/**
 * @fileOverview This file provides for the menu that pops up when
 * you click on the Privly icon in the browser Chrome.
 *
 * The text message on the button determines the operating mode.
 * "off" indicates that the content script can be injected, but it
 * doesn't execute any code.
 *
 * "on" indicates that the content script is injected, and should
 * actively replace links on the user's whitelist.
 *
 * This file depends on the background script modal_button.js.
 *
 */

 /*global chrome:false */

/**
 * Helper function for activateExtension() and deactivateExtension().
 * This makes sure that there is no duplication of code.
 */
function extensionStateChange(color, text, toShow, toHide) {
  // Set the text and text color
  chrome.browserAction.setBadgeBackgroundColor({color: color});
  chrome.browserAction.setBadgeText({text: text});

  // Defined in reading_process.js
  chrome.runtime.sendMessage({handler: "modeChange"});

  // Update the UI
  $(toShow).show();
  $(toHide).hide();
}

/**
 * Activate application injection by messaging the background scripting
 * environment. The background scripting environment will then message
 * the privly.js content script.
 */
function activateExtension() {
  // Call the helper function to make necessary changes
  extensionStateChange("#004F00", "on", "#deactivateExtension", "#activateExtension");
}

/**
 * Deactivate application injection by messaging the background scripting
 * environment. The background scripting environment will then message
 * the privly.js content script.
 */
function deactivateExtension() {
  // Call the helper function to make necessary changes
  extensionStateChange("#FF0000", "off", "#activateExtension", "#deactivateExtension");
}

// Set the activation UI
$("#deactivateExtension").click(deactivateExtension);
$("#activateExtension").click(activateExtension);

// Open new windows from the links.
var windowOptions =
  "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
$("#PlainPost").click(function(){
  window.open("/privly-applications/PlainPost/new.html", "PlainPost",
    windowOptions);
});
$("#Message").click(function(){
  window.open("/privly-applications/Message/new.html", "Message", windowOptions);
});
$("#history").click(function(){
  window.open("/privly-applications/History/new.html", "History", windowOptions);
});
$("#options").click(function(){
  window.open("/privly-applications/Pages/ChromeOptions.html", "Options", windowOptions);
});
$("#help").click(function(){
  window.open("/privly-applications/Help/new.html", "Help", windowOptions);
});

// Get the current value of the button by its badge text,
// then update the UI in the popup accordingly.
chrome.browserAction.getBadgeText({},
  function(currentText) {
    if (currentText === "off") {
      $("#activateExtension").show();
      $("#deactivateExtension").hide();
    } else {
      $("#activateExtension").hide();
      $("#deactivateExtension").show();
    }
  }
);
