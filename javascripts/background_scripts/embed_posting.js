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
  case "posting/open_post_dialog":
    // This message comes from the content script
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'posting/open_post_dialog',
      target: 'topframe'
    }, sendResponse);

    return true;

  case "posting/popup_login":
    chrome.windows.create({
      url: chrome.extension.getURL("privly-applications/Login/new.html?" + request.loginCallbackUrl),
      focused: true,
      top: 0,
      left: 0,
      type: "normal"
    });

    break;

  case "posting/on_login_closed":
    // when logged in, we send this message to all tabs
    chrome.tabs.query({}, function (tabs) {
      for (i = 0; i < tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, {
          action: 'posting/on_login_closed',
          target: 'topframe'
        });
      }
    });

    break;

  case "posting/close_post_dialog":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'posting/close_post_dialog',
      target: 'topframe'
    });

    break;

  case "posting/get_form_info":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'posting/get_form_info',
      target: 'nodeframe'
    }, sendResponse);

    return true;

  case "posting/insert_link":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'posting/insert_link',
      link: request.link,
      target: 'nodeframe'
    }, sendResponse);

    return true;

  case "posting/submit":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'posting/submit',
      target: 'nodeframe'
    });

    break;

  case "posting/on_keydown_enter":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'posting/on_keydown_enter',
      keys: request.keys,
      target: 'nodeframe'
    });

    break;

  case "posting/get_target_content":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'posting/get_target_content',
      target: 'nodeframe'
    }, sendResponse);

    return true;

  case "posting/set_target_content":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'posting/set_target_content',
      target: 'nodeframe',
      content: request.content
    });

    break;

  case "posting/focus_target":
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'posting/focus_target',
      target: 'nodeframe'
    });

    break;
  }
});
