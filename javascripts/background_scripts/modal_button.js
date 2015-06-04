/**
 * @fileOverview This file initializes the modal button (browser action).
 * This file initializing the button's state on browser start and
 * change button's state (badage color and text) when user toggles
 * injection in popup.html.
 * 
 * The text message on the button determines the operating mode.
 * "off" indicates that the content script can be injected, but it
 * doesn't execute any code.
 *
 * "on" indicates that the content script is injected, and should
 * actively replace links on the user's whitelist.
 */

/*global chrome */
/*global Privly */

/**
 * This function updates the badge text and background color of the
 * browser action button (modal button) according to the parameter.
 * 
 * @param  {Boolean} enableInjection Whether injection is enabled
 */
function updateBrowserAction(enableInjection) {
  if (enableInjection) {
    chrome.browserAction.setBadgeBackgroundColor({color: "#004F00"});
    chrome.browserAction.setBadgeText({text: "on"});
  } else {
    chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
    chrome.browserAction.setBadgeText({text: "off"});
  }
}

// Subscribe to option changed events
Privly.message.addListener(function (request) {
  if (request.action === 'options/changed') {
    if (request.option === 'options/isInjectionEnabled') {
      updateBrowserAction(request.newValue);
    }
  }
});

// Retrive the initial option value
updateBrowserAction(Privly.options.isInjectionEnabled());
