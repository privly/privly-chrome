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
            chrome.tabs.executeScript(tab.id, 
              { file: "/javascripts/content_scripts/privly.js", 
                allFrames: true });
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
          tab.url.indexOf("chrome") !== 0 && 
          changeInfo.status === "complete") {
        chrome.tabs.executeScript(tabId, 
          {file: "/javascripts/content_scripts/privly.js", 
           allFrames: true,
           runAt: "document_idle"});
      }
    });
}); 
