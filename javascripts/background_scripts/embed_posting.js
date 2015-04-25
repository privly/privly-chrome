chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.ask) {
      case "posting/open_post_dialog":
        // from content script
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'posting/open_post_dialog',
          target: 'topframe'
        }, sendResponse);
        return true;

        break;

      case "posting/popup_login":
        chrome.windows.create({
          url: chrome.extension.getURL("privly-applications/Login/new.html?" + request.loginCallbackUrl),
          focused: true,
          top: 0, left: 0,
          type: "normal"
        });

        break;

      case "posting/on_login_closed":
        // when logged in, we send message to all tabs
        chrome.tabs.query({}, function(tabs) {
          for (var i = 0; i < tabs.length; ++i) {
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

        break;

      case "posting/insert_link":
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'posting/insert_link',
          link: request.link,
          target: 'nodeframe'
        }, sendResponse);
        return true;

        break;

      case "posting/submit":
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'posting/submit',
          target: 'nodeframe'
        });

        break;

      case "posting/on_keypress_enter":
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'posting/on_keypress_enter',
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

        break;

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
