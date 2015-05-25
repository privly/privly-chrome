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

/*global chrome, window */
/*global Privly */

function updateActivateStatus(enabled) {
  if (enabled) {
    $("#activateExtension").hide();
    $("#deactivateExtension").show();
  } else {
    $("#activateExtension").show();
    $("#deactivateExtension").hide();
  }
}

updateActivateStatus(Privly.Options.isInjectionEnabled());

/**
 * Activate application injection.
 * privly.js will get notified from options/changed message.
 */
function activateExtension() {
  Privly.Options.setInjectionEnabled(true);
  updateActivateStatus(true);
}

/**
 * Deactivate application injection.
 * privly.js will get notified from options/changed message.
 */
function deactivateExtension() {
  Privly.Options.setInjectionEnabled(false);
  updateActivateStatus(false);
}

// Set the activation UI
$("#deactivateExtension").click(deactivateExtension);
$("#activateExtension").click(activateExtension);

// Open new windows from the links.
var windowOptions = "menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes";
$("#PlainPost").click(function () {
  window.open("/privly-applications/PlainPost/new.html", "PlainPost", windowOptions);
});
$("#Message").click(function () {
  window.open("/privly-applications/Message/new.html", "Message", windowOptions);
});
$("#history").click(function () {
  window.open("/privly-applications/History/new.html", "History", windowOptions);
});
$("#options").click(function () {
  window.open("/privly-applications/Pages/ChromeOptions.html", "Options", windowOptions);
});
$("#help").click(function () {
  window.open("/privly-applications/Help/new.html", "Help", windowOptions);
});
