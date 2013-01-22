// 
// Set the Privly version number as a header on all requests
//
chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    details.requestHeaders.push({name:'X-Privly-Version', value:'0.0.7'});
    return {requestHeaders: details.requestHeaders};
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestHeaders"]);

//
// browserAction Icon Interaction
//
chrome.browserAction.onClicked.addListener(function(tab) {
  
  // Set the text color to red
  chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
  
  chrome.browserAction.getBadgeText({},
    function(currentText) {
      
      //toggle the on/off state of the button
      if (currentText === "off") {
        chrome.browserAction.setBadgeText({text: ""});
        chrome.browserAction.setTitle({title: "Turn Privly Viewing Off"});
        
        // If the badge text was previously set to off, we probably 
        // need to inject the script.
        chrome.tabs.captureVisibleTab(null, null, function(tab){
          if (tab !== undefined) {
            chrome.tabs.executeScript(tab.id, {file: "/javascripts/privly.js", allFrames: true});
          }
        })
      } else {
        chrome.browserAction.setBadgeText({text: "off"});
        chrome.browserAction.setTitle({title: "Turn Privly Viewing On"});
      }
    });
});

//
// Content Script Loading
//
// Loads content script if the badge text is not set to "off"
//
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  chrome.browserAction.getBadgeText({},
    function(currentText) {
      if (currentText !== "off" && 
          tab.url !== "chrome://newtab/" && 
          changeInfo.status === "complete") {
        chrome.tabs.executeScript(tabId, {file: "/javascripts/privly.js", 
                                           allFrames: true,
                                           runAt: "document_idle"});
      }
    });
}); 


//
// Posting Process
//
// 1. The user selects an editable element with a right click
// 2. The user clicks the "Encrypt and Post" option
// 3. The script records the host page the link will be posted to
// 4. The script opens a posting window and records its ID
// 5. The posting application will complete and send this script 
//    a message with the Privly URL
// 6. The script sends the host page's content script the URL

// Remembers where the PrivlyUrl will be placed based on the context menu
var postingResultTab = undefined;
var postingApplicationTabId = undefined;
var postingApplicationStartingValue = "";

// Handles right click on form event by opening posting window.
var postingHandler = function(info, sourceTab, postingApplicationUrl) {
  
  // only open a new posting window
  if (postingApplicationTabId === undefined) {
    
    postingApplicationStartingValue = info.selectionText;
    
    // Open a new window.
    chrome.windows.create({url: postingApplicationUrl, focused: true}, function(newWindow){
      
      //Get the window's tab
      var tab = newWindow.tabs[0];
      
      //remember the posting tab id
      postingApplicationTabId = tab.id;
      
      //remember the tab id where the post will be placed. The content script
      //will remember which form element was clicked
      postingResultTab = sourceTab;
      
      //tell the host page not to change the posting location on subsequent
      //right click events
      chrome.tabs.sendMessage(postingResultTab.id, {pendingPost: true});
      
    })
  } else {
    // Notify users of their 
    var notification = webkitNotifications.createNotification(
      '../images/logo_48.png',  // icon url - can be relative
      'Privly Warning',  // notification title
      'Close the posting window or finish the post before starting a new post.'  // notification body text
    );
    notification.show();
  }
};

// Creates the context (right click) menu
chrome.contextMenus.create({
    "title": "You Must have a Developer Account",
    "contexts": ["editable"],
    "enabled": false
  });

// Address to open for the ZeroBin posting process
var zeroBinPostingApplicationUrl = "https://privlyalpha.org/zero_bin/";

// Creates the context (right click) menu
chrome.contextMenus.create({
    "title": "Encrypt and Post",
    "contexts": ["editable"],
    "onclick" : function(info, tab) {
        postingHandler(info, tab, zeroBinPostingApplicationUrl);
    }
  });
  
// Address to open for the Privly Post posting process
var privlyPostPostingApplicationUrl = "https://privlyalpha.org/posts/plain_post";

// Creates the context (right click) menu
chrome.contextMenus.create({
    "title": "Post Unencrypted Content",
    "contexts": ["editable"],
    "onclick" : function(info, tab) {
        postingHandler(info, tab, privlyPostPostingApplicationUrl);
    }
  });

// Handles the receipt of Privly URLs for addition to the web page.
// The request object should contain the privlyUrl.
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    
    if (request.privlyUrl !== undefined) {
      
      //Switches current tab to the page receiving the URL
      chrome.tabs.update(postingResultTab.id, {selected: true});
      
      //sends URL to host page
      chrome.tabs.sendMessage(postingResultTab.id, {privlyUrl: request.privlyUrl, pendingPost: false});
      
      //close the posting application
      chrome.tabs.remove(sender.tab.id);
      postingApplicationTabId = undefined;
      
      //remove the record of where we are posting to
      postingResultTab = undefined;
      
    } else if (request.messageSecret !== undefined && sender.tab.id === postingApplicationTabId) {
      //sends starting value to host page
      if( postingApplicationStartingValue !== undefined && 
        postingApplicationStartingValue !== "" ) {
          sendResponse({hostPageString: request.messageSecret + "InitialContent" + 
                        postingApplicationStartingValue});
      }
    }
  });

// If the posting application or host page closes, the state should reset.
// The posting form will close as well.
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  
  if (postingResultTab === undefined || postingApplicationTabId === undefined) {
    return;
  }
  
  if (tabId === postingApplicationTabId) {
    postingApplicationTabId = undefined;
    chrome.tabs.sendMessage(postingResultTab.id, {pendingPost: false});
    postingResultTab = undefined;
  }
  
  if (tabId === postingResultTab.id) {
    chrome.tabs.remove(postingApplicationTabId);
    postingResultTab = undefined;
    postingApplicationTabId = undefined;
  }
});
