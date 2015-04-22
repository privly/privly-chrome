var embed_posting = {
  popupLoginDialog: function(loginCallbackUrl) {
    chrome.windows.create({
      url: chrome.extension.getURL("privly-applications/Login/new.html?" + loginCallbackUrl),
      focused: true,
      top: 0, left: 0,
      type: "normal"
    });
  },

  closeLoginDialog: function() {
    // when logged in, we send message to all tabs
    chrome.tabs.query({}, function(tabs) {
      for (var i = 0; i < tabs.length; ++i) {
        chrome.tabs.sendMessage(tabs[i].id, {action: 'posting/close_login'});
      }
    });
  },

  newPost: function(sourceTab) {
    var postingDomain = ls.getItem("posting_content_server_url");
    if ( postingDomain === undefined ) {
      postingDomain = "https://privlyalpha.org";
      ls.setItem("posting_content_server_url", postingDomain);
    }
    chrome.tabs.sendMessage(sourceTab.id, {action: 'posting/new_post'});
  },

  closePost: function(sourceTab) {
    chrome.tabs.sendMessage(sourceTab.id, {action: 'posting/close_post'});
  },

  ready: function(sourceTab) {
    chrome.tabs.sendMessage(sourceTab.id, {action: 'posting/ready'});
  },

  insertLink: function(sourceTab, link) {
    chrome.tabs.sendMessage(sourceTab.id, {action: 'posting/insert_link', link: link});
  },

  submit: function(sourceTab) {
    chrome.tabs.sendMessage(sourceTab.id, {action: 'posting/submit'});
  },

  keyEnter: function(sourceTab, keys) {
    chrome.tabs.sendMessage(sourceTab.id, {action: 'posting/keyEnter', keys: keys});
  },
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.ask) {
      case "posting/popup_login":
        embed_posting.popupLoginDialog(request.loginCallbackUrl);
        break;
      case "posting/close_login":
        embed_posting.closeLoginDialog();
        break;
      case "posting/new_post":
        embed_posting.newPost(sender.tab);
        break;
      case "posting/close_post":
        embed_posting.closePost(sender.tab);
        break;
      case "posting/ready":
        embed_posting.ready(sender.tab);
        break;
      case "posting/insert_link":
        embed_posting.insertLink(sender.tab, request.link);
        break;
      case "posting/submit":
        embed_posting.submit(sender.tab);
        break;
      case "posting/key_enter":
        embed_posting.keyEnter(sender.tab, request.keys);
        break;
    }
  });
