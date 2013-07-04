/**
 * @fileOverview This script is responsible for integration issues with
 * browser extensions and mobile architectures.
 *
 * This library provides a method for messaging the extension without
 * the host page having access to the messages. It also provides a method
 * for verifying whether messages sent to the application come from a
 * privileged origin. Privileged origins include the extension's scripting
 * environment, or a mobile application.
 *
 * After the extension receives the secret string, it can message the app.
 * Messages should be valid stringified JSON, as would be produced by
 * JSON.stringify. Current messages include:
 *
 * {action: "submit", secret: "secret goes here"} Asks the app to submit itself.
 *
 * {initialContent: "any string", secret: "secret goes here"} This is the value
 * of the form element or highlighted text in the host page. You can request 
 * this content by requesting it: 
 * privlyExtension.messageExtension("your handler's name", "");
 *
 * It is the extension's responsibility to decide whether it trusts messages
 * from the application. The application currently only sends one message to
 * the extension: {privlyUrl: "this is the URL to drop into the host page"}
 *
 **/

/**
 * @namespace
 * Wrapper for behaviors required by extensions.
 */
var privlyExtension = {
  
  /**
   * Send data to the extension or mobile device. The message will be sent
   * according to the messaging pathway required by the current platform.
   *
   * @param handler string The name of the handler in the extension's context.
   * Universally supported names are "privlyUrl", "messageSecret", and 
   * "initialContent"
   * @param data json The value of the message being sent to the extension.
   *
   */
  messageExtension: function(handler, data) {
    // Platform specific messaging
    if (privlyNetworkService.platformName() === "CHROME") {
      var message = {};
      message["handler"] = handler;
      message["data"] = data;
      chrome.extension.sendMessage(
        message,
        privlyExtension.messageHandler);
    } else if(privlyNetworkService.platformName() === "IOS") {
      var iOSurl = "js-frame:" + url;
      var iframe = document.createElement("IFRAME");
      iframe.setAttribute("src", iOSurl);
      iframe.setAttribute("height", "1px");
      iframe.setAttribute("width", "1px");
      document.documentElement.appendChild(iframe);
      iframe.parentNode.removeChild(iframe);
      iframe = null;
    } else if(privlyNetworkService.platformName() === "ANDROID") {
      androidJsBridge.receiveNewPrivlyURL(url);
    } else {
      
      // fallback is to fire an event that an extension may be able to capture
      var element = document.createElement("privlyEventSender");  
      element.setAttribute("data-message-body", value);  
      document.documentElement.appendChild(element);  
      
      var evt = document.createEvent("Events");  
      evt.initEvent("PrivlyMessageEvent", true, false);  
      element.dispatchEvent(evt);
    }
  },
  
  /**
   * Message the extension a URL.
   * This is used in posting dialogs where the application pops up for the
   * user to create a post.
   *
   * @param {string} url the URL to send to the extension.
   *
   */
  firePrivlyURLEvent: function(url) {
    privlyExtension.messageExtension("privlyUrl", url);
  },
  
  /**
   * A shared secret between the application and the extension.
   */
  sharedSecret: null,
  
  /**
   * This function handles all messages sent to the app using the postMessage
   * interface. In order to verify that the sender of the message should be
   * trusted, this callback the initialization of a shared secret between the
   * app and the extension. The secret is initialized from 
   * firePrivlyMessageSecretEvent.
   */
  messageHandler: function(message) {
    try {
      if (typeof message === "string") {
        var json = JSON.parse(message);
      } else {
        var json = message;
      }
      if (privlyExtension.sharedSecret !== null && 
          privlyExtension.sharedSecret === json.secret) {
        privlyExtension[json.handler](json);
      }
    } catch(error) {
      console.warn("Incompatible message was sent to application:");
    }
  },
  
  
  /**
   * Send a random sequence of characters to privly-type extensions.
   * Messages containing the random sequence will be assumed to come
   * from the privileged context of an extension or mobile applicaiton
   * since only those platforms have access to the random string.
   */
  firePrivlyMessageSecretEvent: function() {
    
    // This is not cryptographically secure and should not be used in
    // instances where the remote page could attempt a dictionary attack
    privlyExtension.sharedSecret = Math.random().toString(36).substring(2) + 
                 Math.random().toString(36).substring(2) +  
                 Math.random().toString(36).substring(2);
    
    privlyExtension.messageExtension("messageSecret", 
                                     privlyExtension.sharedSecret);
    
    window.addEventListener("message", 
      privlyExtension.messageHandler,
      false);
    
  }
  
};
