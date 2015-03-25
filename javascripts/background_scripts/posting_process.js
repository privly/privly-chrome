/**
 * @fileOverview This file provides for posting new links generated by the
 * extension to a host page.
 *
 * Posting Process:
 *
 * 1. The user selects an editable element with a right click
 * 2. The user clicks a Privly posting application in the resultant context
 *    menu.
 * 3. This script records the host page the link will be posted to
 * 4. The script opens a posting window and records its ID
 * 5. The posting application will complete and send this script
 *    a message with the Privly URL
 * 6. The script sends the host page's content script,
 *    post_new_link.js, the URL
 */

  /*global chrome:false, ls:true, notification:true */


/**
 * @namespace Functionality for posting new links to pages.
 */
var postingProcess = {

  /**
   * The secret that should be included in messages to the application.
   */
  messageSecret: null,

  /**
   * Handles right click on form event by opening posting window.
   *
   * @param {OnClickData} info Information on the context menu generating
   * this event.
   * @param {tab} sourceTab The tab that was clicked for the context menu
   * @param {string} postingApplicationName the name of the posting application.
   * for examples, see the creation of the context menus below. Current values
   * include PlainPost and Message.
   *
   */
  postingHandler: function(info, sourceTab, postingApplicationName) {

    // only open a new posting window
    if (postingProcess.postingApplicationTabId === undefined) {

      var postingDomain = ls.getItem("posting_content_server_url");
      if ( postingDomain === undefined ) {
        postingDomain = "https://privlyalpha.org";
        ls.setItem("posting_content_server_url",postingDomain);
      }

      var postingApplicationUrl = chrome.extension.getURL("privly-applications/" +
                                                           postingApplicationName +
                                                           "/new.html");

      if( info.selectionText !== undefined ) {
        postingProcess.postingApplicationStartingValue = info.selectionText;
      } else {
        postingProcess.postingApplicationStartingValue = "";
      }

      // Open a new window.
      chrome.windows.create({url: postingApplicationUrl, focused: true,
                             top: 0, left: 0,
                             type: "normal"},
        function(newWindow){

          //Get the window's tab
          var tab = newWindow.tabs[0];

          //remember the posting tab id
          postingProcess.postingApplicationTabId = tab.id;

          //remember the tab id where the post will be placed. The content script
          //will remember which form element was clicked
          postingProcess.postingResultTab = sourceTab;

          //tell the host page not to change the posting location on subsequent
          //right click events
          chrome.tabs.sendMessage(postingProcess.postingResultTab.id,
            {pendingPost: true});
        }
      );
    } else {
      var notification = new Notification("There is already a pending post",
        {icon: "images/logo_48.png"});
      notification.show();
    }
  },

  /**
   * Handles the receipt of Privly URLs from the posting application
   * for addition to the host page.
   *
   * @param {object} request The request object's JSON document.
   * The request object should contain the privlyUrl.
   * @param {object} sender Information on the sending posting application
   * @param {function} sendResponse The callback function for replying to message
   *
   * @return {null} The function does not return anything, but it does call the
   * response function.
   */
  receiveNewPrivlyUrl: function(request, sender, sendResponse) {

    if (request.handler === "privlyUrl" &&
      postingProcess.postingResultTab !== undefined) {

      //Switches current tab to the page receiving the URL
      // selected is deprecated
      // See https://groups.google.com/a/chromium.org/forum/#!topic/chromium-extensions/gWamKdDzZNQ
      // chrome.tabs.update(postingProcess.postingResultTab.id, {selected: true});

      //sends URL to host page
      chrome.tabs.sendMessage(postingProcess.postingResultTab.id,
        {privlyUrl: request.data, pendingPost: false},
        function(response) {
          if (response.ok) {
            //close the posting application
            chrome.tabs.remove(sender.tab.id);
            postingProcess.postingApplicationTabId = undefined;

            //remove the record of where we are posting to
            postingProcess.postingResultTab = undefined;
          }
        });
    }
  },

  /**
   * Receives the secret message from the privly-application so
   * it can send messages in the future with the secret token.
   * Otherwise the applications will not trust the origin of the
   * messages.
   *
   * @param {object} request The request object's JSON document.
   * The request object should contain the privlyUrl.
   * @param {object} sender Information on the sending posting application
   * @param {function} sendResponse The callback function for replying to message
   *
   * @return {null} The function does not return anything, but it does call the
   * response function.
   */
  initializeMessagePathway: function(request, sender, sendResponse) {

    if (request.handler === "messageSecret" &&
                 sender.tab.url.indexOf("chrome-extension://") === 0) {
      postingProcess.messageSecret = request.data;
      sendResponse({secret: postingProcess.messageSecret,
                    handler: "messageSecret"});
    } else if (request.handler === "initialContent" &&
               sender.tab.id === postingProcess.postingApplicationTabId) {
      sendResponse({secret: postingProcess.messageSecret, initialContent:
                    postingProcess.postingApplicationStartingValue, handler: "initialContent"});
    }
  },

  /**
   * Send the privly-application the initial content, if there is any.
   *
   * @param {object} request The request object's JSON document.
   * The request object should contain the privlyUrl.
   * @param {object} sender Information on the sending posting application
   * @param {function} sendResponse The callback function for replying to message
   *
   * @return {null} The function does not return anything, but it does call the
   * response function.
   */
  sendInitialContent: function(request, sender, sendResponse) {

    if (request.handler === "initialContent" &&
               sender.tab.id === postingProcess.postingApplicationTabId) {
      sendResponse({secret: postingProcess.messageSecret, initialContent:
                    postingProcess.postingApplicationStartingValue, handler: "initialContent"});
    } else if(request.handler === "initialContent") {
      sendResponse({secret: postingProcess.messageSecret, initialContent: "",
        handler: "initialContent"});
    }
  },

  /**
   * Handle closure of posting application tabs. If the posting application
   * or host page closes, the state should reset. The posting form will close
   * as well.
   *
   * @param {integer} tabId The ID of the tab removed.
   * @param {removeInfo} removeInfo Information on the removal.
   *
   */
  tabRemoved: function(tabId, removeInfo) {

    if (postingProcess.postingResultTab === undefined ||
        postingProcess.postingApplicationTabId === undefined) {
      return;
    }

    // The tab generating the URL closed
    if (tabId === postingProcess.postingApplicationTabId) {
      chrome.tabs.sendMessage(postingProcess.postingResultTab.id, {pendingPost: false});
    } else if (tabId === postingProcess.postingResultTab.id) {
      // The tab receiving the URL Closed
      chrome.tabs.remove(postingProcess.postingApplicationTabId);
    }
    postingProcess.postingResultTab = undefined;
    postingProcess.postingApplicationTabId = undefined;
    postingProcess.postingApplicationStartingValue = "";
  },

  // Remembers where the PrivlyUrl will be placed based on the context menu
  postingResultTab: undefined,
  postingApplicationTabId: undefined,
  postingApplicationStartingValue: ""

};

// Creates the Message context menu
chrome.contextMenus.create({
  "title": "New Message",
  "contexts": ["editable"],
  "onclick" : function(info, tab) {
    postingProcess.postingHandler(info, tab, "Message");
  }
});

// Initialize message listeners
chrome.extension.onMessage.addListener(postingProcess.initializeMessagePathway);
chrome.extension.onMessage.addListener(postingProcess.receiveNewPrivlyUrl);
chrome.extension.onMessage.addListener(postingProcess.sendInitialContent);

// Handle the request sent from posting_button.js when clicking the Privly button
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.ask === "newPost") {

      // The info parameter is 0
      postingProcess.postingHandler(0, sender.tab, "Message");
    }
  });

// Handle the request sent from posting_button.js to display a notfication
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.ask === "showNotification") {
      var notification = new Notification("There is already an open window of a pending Privly post",
        {icon: "images/logo_48.png"});
      notification.show();
    }
  });

// Respond to the request sent from posting_button.js with the value from localStorage["Options:DissableButton"]
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.ask === "PrivlyBtnStatus") {
      if( ls.getItem("Options:DissableButton") === true ) {
        sendResponse({tell: "checked"});
      } else {
        sendResponse({tell: "unchecked"});
      }
    }
  });

// Handle closure of posting application tabs
chrome.tabs.onRemoved.addListener(postingProcess.tabRemoved);
