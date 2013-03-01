/*******************************************************************************
Open Source Initiative OSI - The MIT License (MIT):Licensing
[OSI Approved License]
The MIT License (MIT)

Copyright (c) The Privly Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

*******************************************************************************/


/**
 * @fileOverview For a high level overview of what this script does, see:
 * http://www.privly.org/content/core-functionality-privlyjs
 * @author Sean McGregor
 * @version 0.2-dev
 **/
 
/**
 * @namespace
 * Script injected into the host page.
 */
var privly = {
  
  /**
   * These messages are displayed to users. All messages should be placed 
   * here to assist in the localization process.
   */
  messages: {
    sleepMode: "Privly is in sleep mode so it can catch up with " +
      "demand. The content may still be viewable by clicking this link",
    passiveModeLink: "Read in Place",
    contentExpired: "The content behind this link likely expired. Click the link to check.",
    privlyContent: "Privly Content: ",
    injectableContent: "Injectable Content: ",
    burntPrivlyContent: "Burnt Privly Content: "
  },
  
  /**
   * Gives a map of the URL parameters and the anchor. 
   * This method assumes the parameters and the anchor are encoded
   * with encodeURIcomponent. Parameters present in both the anchor text
   * and the parameter section will default to the server parameters.
   *
   * @param {string} url The url you need a map of parameters from.
   *
   * @returns {object} Contains a dictionary of the parameter values.
   */
  getUrlVariables: function(url) {
    
    "use strict";
    
    var vars = {};
    var anchorString, parameterArray, i, pair, key, value;

    //Get the variables from the anchor string
    if (url.indexOf("#",0) > 0)
    {
      anchorString = url.substring(url.indexOf("#") + 1);
      parameterArray = anchorString.split("&");
      for (i = 0; i < parameterArray.length; i++) {
        pair = parameterArray[i].split("=");
        key = decodeURIComponent(pair[0]);
        value = decodeURIComponent(pair[1]);
        vars[key] = value;
      }
    }
    
    //Get the variables from the query parameters
    if (url.indexOf("?",0) > 0)
    {
      var anchorIndex = url.indexOf("#");
      if ( anchorIndex < 0 ) {
        anchorIndex = url.length;
      }
      anchorString = url.substring(url.indexOf("?") + 1, anchorIndex);
      parameterArray = anchorString.split("&");
      for (i = 0; i < parameterArray.length; i++) {
        pair = parameterArray[i].split("=");
        key = decodeURIComponent(pair[0]);
        value = decodeURIComponent(pair[1]);
        vars[key] = value;
      }
    }
    
    //Recursively assign the parameters from the ciphertext URL 
    if (vars.privlyCiphertextURL !== undefined)
    {
      var cipherTextParameters = privly.getUrlVariables(vars.privlyCiphertextURL);
      for(var item in cipherTextParameters) {
        vars[item] = cipherTextParameters[item];
      }
    }
    //Example:
    //https://priv.ly/posts/1?hello=world#fu=bar
    //privly.getUrlVariables(url).hello is "world"
    //privly.getUrlVariables(url).fu is "bar"
    return vars;
  },
  
  /** 
   * The Privly RegExp determines which links are eligible for
   * automatic injection.
   * This system will need to change so we can move to a whitelist 
   * approach. See: http://www.privly.org/content/why-privly-server
   *
   * Currently matched domains are priv.ly, dev.privly.org, dev.privly.com, 
   * privly.com, pivly.org, privly.com, and localhost
   *
   */
  privlyReferencesRegex: new RegExp(
    "\^(https?:\\/\\/){0,1}(" + //protocol
    "priv\\.ly\\/|" + //priv.ly
    "dev\\.privly\\.org\\/|" + //dev.privly.org
    "localhost\\/|" + //localhost
    "privlyalpha.org\\/|" + //localhost
    "privlybeta.org\\/|" + //localhost
    "localhost:3000\\/" + //localhost:3000
    ")(\\S){3,}$","gi"),
    //the final line matches
    //end of word
  
  /** 
   * Holds the identifiers for each of the modes of operation.
   * Extension modes are set through firefox's extension api.
   * https://developer.mozilla.org/en/Code_snippets/Preferences
   */
  extensionModeEnum : {
    ACTIVE : 0,
    PASSIVE : 1,
    CLICKTHROUGH : 2
  },
  
  /**
   * Sets a mode of operation found in extensionModeEnum.
   */
  extensionMode: 0,
  
  /** 
   * Adds 'http' to strings if it is not already present
   *
   * @param {string} domain the domain potentially needing a protocol.
   *
   * @returns {string} The corresponding URL
   */
  makeHref: function(domain)
  {
    "use strict";
    var hasHTTPRegex = /^((https?)\:\/\/)/i;
    if (!hasHTTPRegex.test(domain)) {
      domain = "http://" + domain;
    }
    return domain;
  },
  
  /**
   * Make plain text links into anchor elements.
   */
  createLinks: function()
  {
    "use strict";
    /***********************************************************************
    Inspired by Linkify script:
      http://downloads.mozdev.org/greasemonkey/linkify.user.js
      
    Originally written by Anthony Lieuallen of http://arantius.com/
    Licensed for unlimited modification and redistribution as long as
    this notice is kept intact.
    ************************************************************************/
    
    var excludeParents = ["a", "applet", "button", "code", "form",
                           "input", "option", "script", "select", "meta",
                           "style", "textarea", "title", "div","span"];
    var excludedParentsString = excludeParents.join(" or parent::");
    var xpathExpression = ".//text()[not(parent:: " +
        excludedParentsString +")]";
        
    var textNodes = document.evaluate(xpathExpression, document.body, null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
        
    for (var i=0; i < textNodes.snapshotLength; i++){
      var item = textNodes.snapshotItem(i);
        
      var itemText = item.nodeValue;
      
      privly.privlyReferencesRegex.lastIndex = 0;
      if (privly.privlyReferencesRegex.test(itemText)){
        var span = document.createElement("span");
        var lastLastIndex = 0;
        privly.privlyReferencesRegex.lastIndex = 0;
        
        var results = privly.privlyReferencesRegex.exec(itemText);
        while ( results ){
          span.appendChild(document.createTextNode(
            itemText.substring(lastLastIndex, results.index)));
            
          var rawHref = results[0];
          var text = (rawHref.indexOf(" ") === 0)?rawHref.substring(1):rawHref;
          
          var href = privly.makeHref(text);
          
          var a = document.createElement("a");
          a.setAttribute("href", href);
          a.appendChild(document.createTextNode(
            text.substring(0,4).toLowerCase() + text.substring(4)));
          if (href.indexOf(" ") === 0) {
            span.appendChild(document.createTextNode(" "));
          }
          span.appendChild(a);
          lastLastIndex = privly.privlyReferencesRegex.lastIndex;
          results = privly.privlyReferencesRegex.exec(itemText);
        }
        span.appendChild(document.createTextNode(
          itemText.substring(lastLastIndex)));
        item.parentNode.replaceChild(span, item);
      }
    }
  },
  
  /**
   * Kill default link behaviour on Privly Link, which was clicked, and
   * replace the link with the referenced content.
   *
   * @param {event} e An event triggered by clicking a link, which needs
   * replacing
   */
  makePassive: function(e)
  {
    "use strict";
    //Preventing the default link behavior
    e.cancelBubble = true;
    e.stopPropagation();
    e.preventDefault();
    privly.injectLink(e.target);
  },
  
  /**
   * Changes hyperlinks to reference the proper url.
   * Twitter and other hosts change links so they can collect
   * click events. It also sets a non-standard attribute,
   * privlyHref, to the correct href. If the privlyHref is
   * present, the script will use it instead of the standard href.
   * The privlyHref is recommended for sites that use javascript
   * to swap hrefs for tracking purposes.
   */
  correctIndirection: function()
  {
    "use strict";
    var anchors = document.links;
    var i = anchors.length;
    while (i--){
      var a = anchors[i];
      
      privly.privlyReferencesRegex.lastIndex = 0;
      if (a.href && !privly.privlyReferencesRegex.test(a.href))
      {
        //check if Privly is in the body of the text
        privly.privlyReferencesRegex.lastIndex = 0;
        if (privly.privlyReferencesRegex.test(a.textContent)) {
          // If the href is not present or is on a different domain
          privly.privlyReferencesRegex.lastIndex = 0;
          var results = privly.privlyReferencesRegex.exec(a.textContent);
          var newHref = privly.makeHref(results[0]);
          a.setAttribute("href", newHref);
          a.setAttribute("privlyHref", newHref);
        }
        
        //check if Privly was moved to another attribute
        for (var y = 0; y < a.attributes.length; y++) {
          var attrib = a.attributes[y];
          if (attrib.specified === true) {
            privly.privlyReferencesRegex.lastIndex = 0;
            if (privly.privlyReferencesRegex.test(attrib.value)) {
              a.setAttribute("href", attrib.value);
              a.setAttribute("privlyHref", newHref);
            }
          }
        }
      }
      else
      {
        a.setAttribute("privlyHref", a.href);
      }
      privly.privlyReferencesRegex.lastIndex = 0;
    }
  },
  
  /**
   * Counter for injected iframe identifiers. This variable is also used
   * to indicate how many iframes have been injected so that the script
   * will not inject too many iframes.
   */
  nextAvailableFrameID: 0,
  
  
  injectLinkApplication: function(object, applicationUrl, id)
  {
    "use strict";
    
    object.setAttribute("data-privly-exclude", "true");
    
    var iFrame = document.createElement('iframe');
    
    //Styling and display attributes
    iFrame.setAttribute("frameborder","0");
    iFrame.setAttribute("vspace","0");
    iFrame.setAttribute("hspace","0");
    iFrame.setAttribute("width","100%");
    iFrame.setAttribute("marginwidth","0");
    iFrame.setAttribute("marginheight","0");
    iFrame.setAttribute("height","1px");
    iFrame.setAttribute("frameborder","0");
    iFrame.setAttribute("style","width: 100%; height: 32px; " +
      "overflow: hidden;");
    iFrame.setAttribute("scrolling","no");
    iFrame.setAttribute("overflow","hidden");
    
    //Determines whether the element will be shown after it is toggled.
    //This allows for the button to turn on and off the display of the
    //injected content.
    iFrame.setAttribute("data-privly-display", "true");
    object.setAttribute("data-privly-display", "false");
    object.style.display = "none";
    
    //Custom attribute indicating this iframe is eligible for being resized by
    //its contents
    iFrame.setAttribute("data-privly-accept-resize","true");
    
    //Set the source URL
    iFrame.setAttribute("src", applicationUrl);
    
    //The id and the name are the same so that the iframe can be 
    //uniquely identified and resized
    var frameIdAndName = "ifrm" + id;
    iFrame.setAttribute("id", frameIdAndName);
    iFrame.setAttribute("name", frameIdAndName);
    
    //put the iframe into the page
    object.parentNode.insertBefore(iFrame, object);
  },
  
  /**
   * Replace an anchor element with its referenced content. This function
   * will opt for a locally stored application if there is one, otherwise
   * it will inject the remote code.
   *
   * @param {object} object A hyperlink element to be replaced
   * with an iframe referencing its content
   */
  injectLink: function(object)
  {
    "use strict";
    
    //Sets content URLs.
    var frameId = privly.nextAvailableFrameID++;
    var iframeUrl = object.href;
    if (object.privlyHref !== undefined) {
      iframeUrl = object.privlyHref;
    }
    if (object.href.indexOf("?") > 0){
      iframeUrl = iframeUrl.replace("?","?format=iframe&frame_id=" +
        frameId + "&");
    }
    else if (object.href.indexOf("#") > 0)
    {
      iframeUrl = iframeUrl.replace("#","?format=iframe&frame_id=" +
        frameId + "#");
    }
    
    // Only the Chrome extension currently supports local code storage.
    // other extensions will default to remote code execution.
    if (chrome !== undefined && chrome.extension !== undefined && 
      chrome.extension.sendMessage !== undefined) {
        chrome.extension.sendMessage(
          {privlyOriginalURL: iframeUrl},
          function(response) {
            if( response.privlyApplicationURL !== undefined ) {
              privly.injectLinkApplication(object, response.privlyApplicationURL, frameId);
            }
          });
      } else {
        privly.injectLinkApplication(object, iframeUrl, frameId);
      }
  },
  
  /** 
   * This is a helper method for determining whether a DOM node is editable.
   * We generally don't want to replace a link in an element that is eligible
   * for editing because these occur in email editors.
   *
   * @param {DOM node} node The node for which we want to know if
   * it is editable.
   *
   * @return {boolean} Indicates whether the node is editable.
   *
   */
  isEditable: function(node) {

   "use strict";

   if ( node.contentEditable === "true" ) {
     return true;
   } else if ( node.contentEditable === "inherit" ) {
     //support for the Closure library
     if ( node.getAttribute("g_editable") === "true" ) {
       return true;
     } else if ( node.parentNode !== undefined && node.parentNode !== null ) {
       return privly.isEditable(node.parentNode);
     } else {
       return false;
     }
   } else {
     return false;
   }
  },
  
  /**
   * Process a link according to its parameters and whitelist status.
   * If the link is in active mode and is whitelisted, it will replace
   * the link with the referenced content. If the link is in passive mode
   * or it is not a whitelisted link, the link will be clickable to replace
   * the content. Parameters on the link can also affect how the link is
   * processed. All link parameters are optional.
   *
   * @param {object} anchorElement A hyperlink element eligible for 
   * processessing by Privly. The link may define the following parameters
   * which this function will check
   * burntAfter: specifies a time in seconds in the Unix epoch
   * until the content is likely destroyed on the remote server
   * Destruction of the content should result in a change of message,
   * but not a request to the remote server for the content
   *
   * burntMessage: Display this message if the content was burnt, as
   * indicated by the burnAfter parameter.
   *
   * passiveMessage: Display this message when the extension is in
   * passive mode.
   *
   * passive: Forces the link into passive mode
   * exclude: Force the link to not be replaced or put into passive
   * mode
   *
   * @see privly.getUrlVariables
   */
  processLink: function(anchorElement)
  {
    "use strict";
    
    // Don't process editable links
    if ( privly.isEditable(anchorElement) ){
      return;
    }
    
    this.privlyReferencesRegex.lastIndex = 0;
    var whitelist = this.privlyReferencesRegex.test(anchorElement.href);
    
    var exclude = anchorElement.getAttribute("data-privly-exclude");
    
    //deprecated
    exclude = exclude || anchorElement.getAttribute("privly-exclude");
    
    var params = privly.getUrlVariables(anchorElement.href);
    
    var privlyExcludeUndefined = (params.exclude === undefined &&
      params.privlyExclude === undefined);
    
    if (!exclude && privlyExcludeUndefined) {
      
      var passive = this.extensionMode === privly.extensionModeEnum.PASSIVE ||
        params.passive !== undefined ||  params.privlyPassive !== undefined ||
        !whitelist || privly.nextAvailableFrameID > 39;
      var burnt = params.burntAfter !== undefined && //deprecated
        parseInt(params.burntAfter, 10) < Date.now()/1000;//deprecated
      if (!burnt) {
        burnt = params.privlyBurntAfter !== undefined && 
          parseInt(params.privlyBurntAfter, 10) < Date.now()/1000;
      }
      var active = this.extensionMode === privly.extensionModeEnum.ACTIVE &&
        whitelist;
      var sleepMode = this.extensionMode === privly.extensionModeEnum.CLICKTHROUGH &&
        whitelist;
      
      if (!whitelist){
        anchorElement.textContent = privly.messages.injectableContent +
          privly.messages.passiveModeLink;  
        anchorElement.addEventListener("mousedown",privly.makePassive,true);
      }
      else if (burnt)
      {
        if (params.burntMessage !== undefined)
        {
          anchorElement.textContent = privly.messages.burntPrivlyContent + 
            params.burntMessage;
        }
        else if(params.privlyBurntMessage !== undefined)
        {
          anchorElement.textContent = privly.messages.burntPrivlyContent + 
            params.privlyBurntMessage;
        }
        else
        {
          anchorElement.textContent = privly.messages.contentExpired;
        }
        anchorElement.setAttribute('target','_blank');
        anchorElement.addEventListener("mousedown", privly.makePassive, true);
      }
      else if (passive){
        if (params.passiveMessage !== undefined)
        {
          anchorElement.textContent = privly.messages.privlyContent + 
            params.passiveMessage;
        }
        else if(params.privlyPassiveMessage !== undefined)
        {
          anchorElement.textContent = privly.messages.privlyContent + 
            params.privlyPassiveMessage;
        }
        else
        {
          anchorElement.textContent = privly.messages.privlyContent +
            privly.messages.passiveModeLink;
        }
        anchorElement.addEventListener("mousedown", privly.makePassive,true);
      }
      else if (active){
        this.injectLink(anchorElement);
      }
      else if (sleepMode){
        anchorElement.textContent = privly.messages.sleepMode;
        anchorElement.setAttribute('target','_blank');
        anchorElement.removeEventListener("mousedown", privly.makePassive, true);
      }
    }
  },
  
  /**
   * Replace all Privly links with their iframe or
   * a new link, which when clicked will be replaced
   * by the iframe.
   *
   * If a link has the attribute data-privly-exclude, as in here:
   *
   * <a href="https://example.com" data-privly-exclude="true">
   */
  injectLinks: function()
  {
    "use strict";
    
    var anchors = document.links;
    var i = anchors.length;
    
    while (--i >= 0){
      var a = anchors[i];
      if (a.href && a.href.indexOf("privlyInject1",0) > 0)
      {
        privly.processLink(a);
      }
      else if (a.href && a.href.indexOf("INJECTCONTENT0",0) > 0)
      {
        privly.processLink(a);
      }
    }
  },
  
  /**
   * Receive an iframe resize message sent by the iframe using postMessage.
   * Injected iframe elements need to know the height of the iframe's contents.
   * This function receives a message containing the height of the iframe, and
   * resizes the iframe accordingly.
   *
   * @param {message} message A posted message from one of the trusted domains
   * it contains the name or id of the iframe, and height of the iframe's 
   * contents
   *
   */
  resizeIframePostedMessage: function(message){
    
    "use strict";
    
    //check the format of the message
    if (message.origin === undefined || message.origin === "null" || 
        message.data.indexOf(',') === 0) {
      return;
    }
    
    var data = message.data.split(",");
    var iframeIdOrName = "ifrm" + data[0];
    
    //Get the element by id (deprecated), then get it by name if that fails.
    var iframe = document.getElementById(iframeIdOrName);
    if (iframe === null) {
      iframeIdOrName = data[0];
      iframe = document.getElementsByName(iframeIdOrName)[0];
    }
    if (iframe == undefined) {
      return;
    }
    
    // Only resize iframes eligible for resize.
    // All iframes eligible for resize have a custom attribute,
    // data-privly-accept-resize, set to true.
    var acceptresize = iframe.getAttribute("data-privly-accept-resize");
    if (acceptresize === undefined || acceptresize === null || 
      acceptresize !== "true") {
      return;
    }
    
    var sourceURL = iframe.getAttribute("src");
    var originDomain = message.origin;
    sourceURL = sourceURL.replace("http://", "https://");
    originDomain = originDomain.replace("http://", "https://");
    
    //make sure the message comes from the expected domain
    if (sourceURL.indexOf(originDomain) === 0)
    {
      iframe.style.height = data[1]+'px';
    }
  },
  
  /** 
   * Indicates whether the script is waiting to run again.
   * This prevents DOMNodeInserted from sending hundreds of extension runs
   * @see privly.run
   */
  runPending: false,
  
  /**
   * Perform the current mode of operation on the page.
   * @see privly.runPending
   */
  run: function()
  {
    "use strict";
    
    privly.dispatchResize();
    
    //respect the settings of the host page.
    //If the body element has data-privly-exclude=true
    var body = document.getElementsByTagName("body");
    if (body && body.length > 0 && body[0]
        .getAttribute("data-privly-exclude")==="true")
    {
      return;
    }
    
    //Deprecated
    if (body && body.length > 0 && body[0]
        .getAttribute("privly-exclude")==="true")
    {
      return;
    }
    
    var elements = document.getElementsByTagName("privModeElement");
    if (elements.length > 0){
      this.extensionMode = parseInt(elements[0].getAttribute('mode'), 10);
    }
    
    if (this.extensionMode !== privly.extensionModeEnum.CLICKTHROUGH) {
      privly.createLinks();
      privly.correctIndirection();
      privly.injectLinks();
    }
  },
  
  /**
   * Listener Function Called when the page is modified with dynamic content
   * @see privly.addListeners
   */
  listenerDOMNodeInserted: function(event) {
    //we check the page a maximum of two times a second
    if (privly.runPending) {
      return;
    }
    
    privly.runPending = true;
    
    setTimeout(
      function(){
        privly.runPending = false;
        privly.run();
      },
      500);
  },
  
  /**
   * Runs privly once then registers the update listener
   * for dynamic pages.
   *
   * The host page can prevent the non-resize functionality on the page
   * by defining data-privly-exclude="true" as an attribute on either
   * the body element.
   *
   * @see privly.listenerDOMNodeInserted 
   * @see privly.removeListeners 
   */
  addListeners: function(){
    
    "use strict";
    
    //The content's iframe will post a message to the hosting document.
    //This listener sets the height  of the iframe according to the messaged
    //height
    window.addEventListener("message", privly.resizeIframePostedMessage,
      false, true);
    
    privly.runPending = true;
    setTimeout(
      function(){
        privly.runPending = false;
        privly.run();
      },
      100);
      
    //Everytime the page is updated via javascript, we have to check
    //for new Privly content. This might not be supported on other platforms
    document.addEventListener("DOMNodeInserted", privly.listenerDOMNodeInserted);
    
  },
  
  /**
   * Removes event listeners defined by the script. This is primarily 
   * used to deactivate the content script from the Browser's user
   * interface.
   * @see privly.addListeners 
   */
  removeListeners: function(){
    
    "use strict";
    
    window.removeEventListener("message", privly.resizeIframePostedMessage,
      false);
    document.removeEventListener("DOMNodeInserted", privly.listenerDOMNodeInserted);
    privly.runPending = false;
  },
  
  /**
   * Toggles the display of links and the iframes injected based on the links.
   */
  toggleInjection: function() {
    var iframes = document.getElementsByTagName("iframe");
    for(var i = 0; i < iframes.length; i++) {
      var iframe = iframes[i];
      if (iframe.getAttribute("data-privly-display") === "true") {
        iframe.setAttribute("data-privly-display", "false");
        iframe.style.display = "none";
      } else if(iframe.getAttribute("data-privly-display") === "false") {
        iframe.setAttribute("data-privly-display", "true");
        iframe.style.display = "";
      }
    }
    
    var links = document.getElementsByTagName("a");
    for(var i = 0; i < links.length; i++) {
      var link = links[i];
      if (link.getAttribute("data-privly-display") === "true") {
        link.setAttribute("data-privly-display", "false");
        link.style.display = "none";
      } else if(link.getAttribute("data-privly-display") === "false") {
        link.setAttribute("data-privly-display", "true");
        link.style.display = "inherit";
      }
    }
  },
  
  /**
   * Sends the parent iframe the height of this iframe, only if the "wrapper"
   * div is not specified. Note: This function does not work on Google Chrome
   * due to content script sandboxing. Currently all injected content on
   * Google Chrome is expected to fire its own postMessage event.
   */
  dispatchResize: function() {
    
    "use strict";
    
    return;
    
    //don't send a message if it is the top window
    if (top === this.self) {
      return;
    }
    
    //Only send the message if there is no "wrapper" div element.
    //If there is a wrapper element it might already be a privly
    //iframe, which will send the resize command. I added the wrapper
    //div because its height is the most accurate reflection of the
    //content's height. Future version may remove this element. 
    var wrapper = document.getElementById("wrapper");
    if (wrapper === null) {
      var D = document;
      if(D.body){
        var newHeight = Math.max(
                D.body.scrollHeight, 
                D.documentElement.scrollHeight, 
                D.body.offsetHeight, 
                D.documentElement.offsetHeight, 
                D.body.clientHeight, 
                D.documentElement.clientHeight
            );
        parent.postMessage(window.name + "," + newHeight, "*");
      }
    }    
  },
  
  /** 
   * Cross platform onload event. 
   * won't attach anything on IE on macintosh systems.
   *
   * @param {object} obj The object we are goingt to add 
   * a listener to.
   *
   * @param {string} evType The name of the event to listen for
   *
   * @param {function} fn The handler of the event.
   *
   */
  addEvent: function(obj, evType, fn){
    
    "use strict";
    
    if (obj.addEventListener){
      obj.addEventListener(evType, fn, false);
    }
    else if (obj.attachEvent){
      obj.attachEvent("on"+evType, fn);
    }
  },
  
  /** 
   * Variable indicates whether the script is currently running on the page.
   * This helps toggle the script's operation mode
   */
  started: false,
  
  /**
   * Start this content script if it has not already been started.
   */
  start: function(){
    
    if ( !privly.started ) {
      
      privly.toggleInjection();
      
      privly.started = true;
      
      //This is mostly here for Google Chrome.
      //Google Chrome will inject the top level script after the load event,
      //and subsequent iframes after before the load event.
      if (document.readyState === "complete") {
        privly.addListeners();
        privly.dispatchResize();
      } else {
        //attach listeners for running Privly
        privly.addEvent(window, 'load', privly.addListeners);
        privly.addEvent(window, 'load', privly.dispatchResize);
      }
      
    }
  },
  
  /**
   * Stop this content script if it has already been started.
   */
  stop: function(){
    if (privly.started) {
      privly.started = false;
      privly.removeListeners();
      privly.toggleInjection();
    }
  },
  
  /**
   *
   * Update the list of links to automatically inject.
   * This list is usually defined in a browser extension's
   * user interface.
   *
   * @param {string} domainRegexp The string of domains to be added to the
   * whitelist. The list is passed in as a string formatted for the creation
   * of a new regular expression. Look at the lines of the domains
   * below for properly formatted strings. For example:
   *
   * "|seanbmcgregor\.com\/|localhostx:3000\/"
   *
   * is a properly formatted string.
   */
  updateWhitelist: function(domainRegexp) {
    privly.privlyReferencesRegex = new RegExp(
      "\^(https?:\\/\\/){0,1}(" + //protocol
      "priv\\.ly\\/|" + //priv.ly
      "dev\\.privly\\.org\\/|" + //dev.privly.org
      "localhost\\/|" + //localhost
      "privlyalpha.org\\/|" + //localhost
      "privlybeta.org\\/|" + //localhost
      "localhost:3000\\/" + //localhost:3000
      domainRegexp +
      ")(\\S){3,}$","gi")
  }
};
