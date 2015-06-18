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
 * https://priv.ly/pages/develop.html#ContentScripts
 * @author Sean McGregor
 * @version 0.4.1
 **/
/* global chrome */
/**
 * @namespace
 * Script injected into the host page.
 */
var privly = {

  /**
   * Gives a map of the URL parameters and the anchor.
   * This method assumes the parameters and the anchor are encoded
   * with encodeURIcomponent. Parameters present in both the anchor text
   * and the parameter section will default to the server parameters.
   *
   * Example:
   *   var url = "https://priv.ly/posts/1?hello=world#fu=bar"
   *   privly.getUrlVariables(url).hello is "world"
   *   privly.getUrlVariables(url).fu is "bar"
   *
   * @param {string} url The url you need a map of parameters from.
   *
   * @returns {object} Contains a dictionary of the parameter values.
   */
  getUrlVariables: function(url) {

    "use strict";

    var vars = {};
    var anchorString;

    //Get the variables from the anchor string
    if (url.indexOf("#",0) > 0)
    {
      anchorString = url.substring(url.indexOf("#") + 1);
      privly.addParameterKeyValue(anchorString, vars);
    }

    //Get the variables from the query parameters
    if (url.indexOf("?",0) > 0)
    {
      var anchorIndex = url.indexOf("#");
      if ( anchorIndex < 0 ) {
        anchorIndex = url.length;
      }
      anchorString = url.substring(url.indexOf("?") + 1, anchorIndex);
      privly.addParameterKeyValue(anchorString, vars);
    }

    return vars;
  },

  /**
   * Helper function for getUrlVariables function.
   * Loops through parameterArray and adds the key value pairs.
   */
  addParameterKeyValue: function(anchorString, vars)
  {

    "use strict";

    var parameterArray, i, pair, key, value;

    parameterArray = anchorString.split("&");
    for (i = 0; i < parameterArray.length; i++) {
      pair = parameterArray[i].split("=");
      key = decodeURIComponent(pair[0]);
      value = decodeURIComponent(pair[1]);
      vars[key] = value;
    }
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
    "(?:^|\\s+)(https?:\\/\\/){0,1}(" + //protocol
    "priv\\.ly\\/|" + //priv.ly
    "dev\\.privly\\.org\\/|" + //dev.privly.org
    "localhost\\/|" + //localhost
    "privlyalpha.org\\/|" + //localhost
    "privlybeta.org\\/|" + //localhost
    "localhost:3000\\/" + //localhost:3000
    ")(\\S){3,}/[^\\s]*\\b","gi"),
    //the final line matches
    //end of word

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
      if (item.parentNode.isContentEditable) {
        continue;
      }

      var itemText = item.nodeValue.trim();

      privly.privlyReferencesRegex.lastIndex = 0;
      if (privly.privlyReferencesRegex.test(itemText)){

        var span = document.createElement("span");
        var lastLastIndex = 0;
        privly.privlyReferencesRegex.lastIndex = 0;

        var results = privly.privlyReferencesRegex.exec(itemText);
        while ( results ){
          span.appendChild(document.createTextNode(
            itemText.substring(lastLastIndex, results.index)));

          var text = results[0].trim();

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
          itemText.substring(lastLastIndex + 1)));
        item.parentNode.replaceChild(span, item);
      }
    }
  },

  /**
   * Changes hyperlinks to reference the proper url.
   * Twitter and other hosts change links so they can collect
   * click events. It also sets a non-standard attribute,
   * data-privlyHref, to the correct href. If the data-privlyHref is
   * present, the script will use it instead of the standard href.
   * The data-privlyHref is recommended for sites that use javascript
   * to swap hrefs for tracking purposes.
   */
  correctIndirection: {

    /**
     * Test the string for a well formatted Privly-type link
     * then replace the data-privlyHref attribute if it passes.
     * @param {node} element The element that receives the data-privlyHref
     * string if it passes.
     * @param {string} stringToTest The string whose value
     * we are interested in copying over.
     *
     * @return {boolean} Indicates whether it passed.
     */
    testAndCopyOver: function(element, stringToTest) {
      "use strict";
      privly.privlyReferencesRegex.lastIndex = 0;
      if (privly.privlyReferencesRegex.test(stringToTest)) {
        privly.privlyReferencesRegex.lastIndex = 0;
        var results = privly.privlyReferencesRegex.exec(stringToTest);
        var newHref = privly.makeHref(results[0]);
        element.setAttribute("data-privlyHref", newHref);
        return true;
      }
      return false;
    },

    /**
     * Simulate the Javascript events associated with hovering the element.
     */
    hover: function(elem) {
      "use strict";
      var ev = document.createEvent( 'Events' );
      ev.initEvent( "mouseover", true, false );
      elem.dispatchEvent( ev );
      var ev2 = document.createEvent( 'Events' );
      ev2.initEvent( "mouseout", true, false );
      elem.dispatchEvent( ev2 );
    },

    /**
     * Check all the attributes in turn and use the value if it matches.
     * @param {array} elements array of "a" elements.
     * @return {array} Elements not updated by the function.
     */
    moveFromAttributes: function(elements) {
      "use strict";
      var notUpdated = [];
      elements.forEach(
        function(a){
          var same = true;
          for (var y = 0; y < a.attributes.length; y++) {
            var attrib = a.attributes[y];
            if (attrib.specified === true) {
              if ( attrib.value.indexOf("privlyInject1") > 0 ) {
                same = ! privly.correctIndirection.testAndCopyOver(a, attrib.value);

                // The attribute has the injection parameter but it did not pass
                // replacement. In many cases this indicates the URL will be
                // swapped in by the host page's JS when the element is hovered
                // so we hover the element then run it through this process again.
                if ( same && a.getAttribute("data-privly-hovered") !== "true") {
                  a.setAttribute("data-privly-hovered", "true");
                  privly.correctIndirection.hover(a);
                  var rem = privly.correctIndirection.moveFromAttributes([a]);
                  rem = privly.correctIndirection.moveFromBody(rem);
                  same = (rem.length === 1);
                }
              }
            }
          }
          if ( same ) {notUpdated.push(a);}
        }
      );
      return notUpdated;
    },

    /**
     * Copy matching links from the displayed text of the link.
     * @param {array} elements array of "a" elements.
     * @return {array} Elements not updated by the function.
     */
    moveFromBody: function(elements) {
      "use strict";
      var notUpdated = [];
      elements.forEach(
        function(a){
          // Optimization
          if (  a.textContent.indexOf("privlyInject1") <= 0 
            || ! privly.correctIndirection.testAndCopyOver(a, a.textContent) ) {
            notUpdated.push(a);
          }
      });
      return notUpdated;
    },


    /**
     * Process all the links on the page to discover their true linked
     * destination. The destination is stored to a new attribute on the
     * link, `data-privlyHref`.
     */
    run: function() {
      "use strict";
      var anchors = document.links;
      var remaining = [];
      var i = 0;

      // Pre-process
      for( ; i < anchors.length; i++ ) {
        var a = anchors[i];
        if (a.isContentEditable) {
          continue;
        }

        // Save the current href
        a.setAttribute("data-privlyHref", a.href);

        // Don't correct further indirection if the href passes.
        // Some sites shorten the displayed link while giving the
        // actual link in the anchor.
        privly.privlyReferencesRegex.lastIndex = 0;
        if (a.href && !privly.privlyReferencesRegex.test(a.href))
        {
          remaining.push(a);
        }
      }

      //check if Privly was moved to another attribute
      remaining = privly.correctIndirection.moveFromAttributes(remaining);

      //check if Privly is in the body of the text
      privly.correctIndirection.moveFromBody(remaining);
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
    var attrs= {
      "frameborder":"0",
      "vspace":"0",
      "hspace":"0",
      "width":"100%",
      "marginwidth":"0",
      "marginheight":"0",
      "height":"1px",
      "style":"width: 100%; height: 32px; " + "overflow: hidden;",
      "scrolling":"no",
      "overflow":"hidden",
      "data-privly-display":"true",
      "data-privly-accept-resize":"true", //Indicates this iframe is resize eligible
      "src":applicationUrl,
      "id":"ifrm" + id, //The id and the name are the same so that the iframe can be
      "name":"ifrm" + id //uniquely identified and resized
       };

    //Styling and display attributes
     for(var key in attrs) 
     {
       iFrame.setAttribute(key, attrs[key]);
     }

    //Determines whether the element will be shown after it is toggled.
    //This allows for the button to turn on and off the display of the
    //injected content.
    if ( object.getAttribute("data-privly-display") !== "off" ) {
      object.setAttribute("data-privly-display", "false");
    }
    object.style.display = "none";

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

    //Sets content URL.
    var frameId = privly.nextAvailableFrameID++;
    var iframeUrl = object.getAttribute("data-privlyHref");

    Privly.message.messageExtension({privlyOriginalURL: iframeUrl}, true)
      .then(function (response) {
        if (typeof response.privlyApplicationURL === "string" ) {
          privly.injectLinkApplication(object, response.privlyApplicationURL, frameId);
        }
      });
  },

  /**
   * Process a link according to its parameters and whitelist status.
   * If the link is in active mode and is whitelisted, it will replace
   * the link with the referenced application. If the link is not
   * whitelisted the link will be clickable to replace
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
   * @see privly.getUrlVariables
   */
  processLink: function(anchorElement)
  {
    "use strict";

    // Don't process editable links
    if ( anchorElement.isContentEditable ){
      return;
    }

    var href = anchorElement.getAttribute("data-privlyHref");

    this.privlyReferencesRegex.lastIndex = 0;
    var whitelist = this.privlyReferencesRegex.test(href);

    var exclude = anchorElement.getAttribute("data-privly-exclude");
    var params = privly.getUrlVariables(href);

    if (exclude || params.privlyExclude === "true") {
      return;
    }

    // See if the area containing the link will expand sufficiently
    // by temporarily inflating the link's font-size.
    var priorFontSize = anchorElement.style.fontSize;
    anchorElement.style.fontSize = "200%";
    if(anchorElement.parentNode.offsetHeight < 20 &&
      window.getComputedStyle(anchorElement.parentNode, null).getPropertyValue("height") !== "auto") {
        anchorElement.style.fontSize = priorFontSize;
        return;
    }
    anchorElement.style.fontSize = priorFontSize;

    var burnt = params.privlyBurntAfter !== undefined &&
        parseInt(params.privlyBurntAfter, 10) < Date.now()/1000;

    var shouldInject = whitelist && privly.nextAvailableFrameID <= 39 && !burnt;

    if (shouldInject) {
      this.injectLink(anchorElement);
    }
  },

  /**
   * Process all links that are tagged as supporting injection.
   */
  injectLinks: function()
  {
    "use strict";

    var anchors = document.links;
    var i = anchors.length;

    while (--i >= 0){
      var a = anchors[i];
      if (a.isContentEditable) {
        continue;
      }
      var privlyHref = a.getAttribute("data-privlyHref");

      if (privlyHref && privlyHref.indexOf("privlyInject1",0) > 0)
      {
        privly.processLink(a);
      }
      else if (privlyHref && privlyHref.indexOf("INJECTCONTENT0",0) > 0)
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
   * it contains the name of the iframe, and height of the iframe's
   * contents. Ex: "ifrm0,200"
   *
   */
  resizeIframePostedMessage: function(message){

    "use strict";

    //check the format of the message
    if (typeof(message.origin) !== "string" ||
        typeof(message.data) !== "string" ||
        message.data.indexOf(',') < 1) {
      return;
    }

    //Get the element by name.
    var data = message.data.split(",");
    var iframe = document.getElementsByName(data[0])[0];
    if (iframe === undefined) {
      return;
    }

    // Only resize iframes eligible for resize.
    // All iframes eligible for resize have a custom attribute,
    // data-privly-accept-resize, set to true.
    var acceptresize = iframe.getAttribute("data-privly-accept-resize");
    if (acceptresize !== "true") {
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
   * Run the injection script.
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

    // Deprecated method of deactivating injection from the
    // Firefox extension.
    var elements = document.getElementsByTagName("privModeElement");
    if (elements.length > 0){
      var extensionMode = parseInt(elements[0].getAttribute('mode'), 10);
      if ( extensionMode !== 0 ) {
        return;
      }
    }

    privly.createLinks();
    privly.correctIndirection.run();
    privly.injectLinks();
  },

  /**
   * Listener Function Called when the page is modified with dynamic content
   * @see privly.addListeners
   */
  listenerDOMNodeInserted: function() {
    "use strict";

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


    // Watch the whole body for changes
    var target = document.querySelector("body");
    privly.observer = new MutationObserver(privly.listenerDOMNodeInserted);
    var config = { childList: true, characterData: true,
      subtree: true };
    privly.observer.observe(target, config);
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

    privly.observer.disconnect();
    privly.runPending = false;
  },

  /**
   * Toggles the display of links and the iframes injected based on the links.
   */
  toggleInjection: function() {

    "use strict";

    this.toggleInjectionHelper(document.getElementsByTagName("iframe"), "");
    this.toggleInjectionHelper(document.getElementsByTagName("a"), "inherit");
  },

  /*
   * Helper function for toggling the display of links and iframes
   *
   * @param {array} elements Array of HTML elements to be toggled
   * @param {string} displayStyle CSS style to be used while displaying the HTML elements
   *
   */
  toggleInjectionHelper: function(elements, displayStyle) {

    "use strict"; 
    var i;
    for(i = 0; i < elements.length; i++) {
      var element = elements[i];
      if (element.getAttribute("data-privly-display") === "true") {
        element.setAttribute("data-privly-display", "false");
        element.style.display = "none";
      } else if(element.getAttribute("data-privly-display") === "false") {
        element.setAttribute("data-privly-display", "true");
        element.style.display = displayStyle;
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
    "use strict";
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
    "use strict";
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
    "use strict";
    privly.privlyReferencesRegex = new RegExp(
      "(?:^|\\s+)(https?:\\/\\/){0,1}(" + //protocol
      "priv\\.ly\\/|" + //priv.ly
      "dev\\.privly\\.org\\/|" + //dev.privly.org
      "localhost\\/|" + //localhost
      "privlyalpha\\.org\\/|" + //privlyalpha.org
      "privlybeta\\.org\\/|" + //privlybeta.org
      "localhost:3000\\/" + //localhost:3000
      domainRegexp +
      ")(\\S){3,}/[^\\s]*\\b","gi");
  }
};

/*
 * In order to launch the content script loaded in each iframe of the page
 * (especially the dynamically generated ones) it is needed to tell the
 * background script (reading_process.js) via a message the current operating
 * mode. If it receives confirmation, then privly.start() is called.
 */
Privly.message.addListener(function(message){
  if (message.action === 'options/changed') {
    if (message.option === 'options/isInjectionEnabled') {
      if (message.newValue === true) {
        // enable injection
        privly.start();
      } else {
        // disable injection
        privly.stop();
      }
    } else if (message.option === 'options/getWhitelistRegExp') {
      // whitelist regexp updated
      privly.updatewhitelist(message.newValue);
    }
  }
});

// get injection option
Privly.message.messageExtension({ask: 'options/isInjectionEnabled'}, true)
  .then(function (enabled) {
    if (!enabled) {
      return Promise.reject();
    }
  })
  .then(function () {
    // get whitelist option
    return Privly.message.messageExtension({ask: 'options/getWhitelistRegExp'}, true)
  })
  .then(function (regexp) {
    privly.updateWhitelist(regexp);
    privly.start();
  });