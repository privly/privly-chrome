/**
 *
 * This background script forward messages from embed-posting Privly application
 * (inside an iframe of the host page) or messages from the content script
 * to the content script of the host page.
 *
 * It also pops up new window for user to log in when necessary.
 *
 * When opening embed posting dialogs, we expect the top frame content script
 * to create embed-posting Privly application, thus we use background script
 * here to forward messages to the top frame content script safely.
 *
 * See content_scripts/post_new_link.js for details about those messages.
 * 
 */

/*global chrome:false */

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  var i;
  switch (request.ask) {
  case "embeded/openPostDialog":
    // This message comes from the content script
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeded/openPostDialog',
      target: 'topframe'
    }, sendResponse);

    return true;

  case "embeded/popupLogin":
    chrome.windows.create({
      url: chrome.extension.getURL("privly-applications/Login/new.html?" + request.loginCallbackUrl),
      focused: true,
      top: 0,
      left: 0,
      type: "normal"
    });

    break;

  case "embeded/onLoginClosed":
    // when logged in, we send this message to all tabs
    chrome.tabs.query({}, function (tabs) {
      for (i = 0; i < tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, {
          action: 'embeded/onLoginClosed',
          target: 'topframe'
        });
      }
    });

    break;

  case "embeded/closePostDialog":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeded/closePostDialog',
      target: 'topframe'
    });

    break;

  case "embeded/getFormInfo":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeded/getFormInfo',
      target: 'nodeframe'
    }, sendResponse);

    return true;

  case "embeded/insertLink":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeded/insertLink',
      link: request.link,
      target: 'nodeframe'
    }, sendResponse);

    return true;

  case "embeded/submit":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeded/submit',
      target: 'nodeframe'
    });

    break;

  case "embeded/emitEnterEvent":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeded/emitEnterEvent',
      keys: request.keys,
      target: 'nodeframe'
    });

    break;

  case "embeded/getTargetContent":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeded/getTargetContent',
      target: 'nodeframe'
    }, sendResponse);

    return true;

  case "embeded/setTargetContent":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeded/setTargetContent',
      target: 'nodeframe',
      content: request.content
    });

    break;

  case "embeded/focusTarget":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'embeded/focusTarget',
      target: 'nodeframe'
    });

    break;
  }
});
