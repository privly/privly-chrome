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

/**
 * Activate application injection by messaging the background scripting
 * environment. The background scripting environment will then message
 * the privly.js content script.
 */
function activateExtension() {

  // Set the text color to green
  chrome.browserAction.setBadgeBackgroundColor({color: "#004F00"});
  chrome.browserAction.setBadgeText({text: "on"});
  
  // Defined in reading_process.js
  chrome.runtime.sendMessage({handler: "modeChange"});
  
  // Update the UI
  $("#activateExtension").hide();
  $("#deactivateExtension").show();
}

/**
 * Deactivate application injection by messaging the background scripting
 * environment. The background scripting environment will then message
 * the privly.js content script.
 */
function deactivateExtension() {
  
  // Set the text color to red
  chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
  chrome.browserAction.setBadgeText({text: "off"});
      
  // Defined in reading_process.js
  chrome.runtime.sendMessage({handler: "modeChange"});
  
  // Update the UI
  $("#activateExtension").show();
  $("#deactivateExtension").hide();
}

// Set the activation UI
$("#deactivateExtension").click(deactivateExtension);
$("#activateExtension").click(activateExtension);

// Open new windows from the links.
var windowOptions = "height=500,width=800";
$("#PlainPost").click(function(){
  window.open("/privly-applications/PlainPost/new.html","PlainPost", windowOptions);
});
$("#ZeroBin").click(function(){
  window.open("/privly-applications/ZeroBin/new.html","ZeroBin", windowOptions);
});
$("#index").click(function(){
  window.open("/privly-applications/Index/new.html","Index", windowOptions);
});
$("#options").click(function(){
  window.open("/pages/options.html","Options", windowOptions);
});
$("#help").click(function(){
  window.open("/privly-applications/Help/new.html","Help", windowOptions);
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
