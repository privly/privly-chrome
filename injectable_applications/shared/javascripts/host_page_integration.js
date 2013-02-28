/**
 * @fileOverview This script is responsible for integration issues with a host
 * page. A host page is a website that this application is injected into (eg
 * webmail or a social network). 
 *
 * Injectable applications need to message the host page the height of the
 * iframe's contents. This script assumes you have defined a div on the page
 * with the ID "wrapper". The wrapper is used to determine the proper height 
 * of the iframe, and it should wrap all the visible content.
 *
 **/

/**
 * @namespace
 * Wrapper for behaviors required of injectable applications.
 */
var privlyHostPage = {
    
    /**
     * Send the parent document the height of this iframe's content. This will
     * allow the host page to resize the iframe to match its contents. 
     *
     * @param {integer} height The height of the content needing display.
     */
    dispatchResize: function(height) {
        //This event is fired with the required height of the iframe
        var evt = document.createEvent("Events");  
        evt.initEvent("IframeResizeEvent", true, false);
        var element = document.createElement("privElement");
        element.setAttribute("height", height);  
        var frameId = window.name;
        element.setAttribute("frame_id", frameId);  
        document.documentElement.appendChild(element);    
        element.dispatchEvent(evt);
        // Send the message "id,height" to the parent window
        parent.postMessage(frameId+","+height,"*");
        element.parentNode.removeChild(element);
    },
    
    /**
     * Determine the proper height of this iframe, and then dispatch the
     * resize. This function expects a div with the id "wrapper," to be
     * wrapped around the visible content. The wrapper div is there to support
     * cross platform height discovery.
     */
    resizeToWrapper: function() {
        privlyHostPage.dispatchResize(15);
        jQuery("body").attr("height","100%");
        var newHeight = document.getElementById("privlyHeightWrapper").offsetHeight;
        newHeight += 18; // add 18px just to accommodate the tooltip
        privlyHostPage.dispatchResize(newHeight);
    }
};
