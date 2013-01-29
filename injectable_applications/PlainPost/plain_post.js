/**
 * @fileOverview This script will send the parent document of your
 * iframe the height of the iframe's contents. It will also define a tooltip
 * to indicate that the content is not a natural element of the page.
 * 
 * Requirements: This script assumes the existence of the following CSS:
 *
 * body {
 * cursor:pointer;
 * }
 *
 * #tooltip {
 * position:absolute;
 * border:1px solid #333;
 * background:#f7f5d1;
 * padding:1px 1px;
 * color:#333;
 * display:none;
 * font:14px Helvetica;
 * }
 *
 * You should also appropriatly modify your CSS so that it looks good injected
 * into a web page. This generally means removing all navigation and formatting
 * from your site.
 * 
 * This script assumes that jquery is defined, but this dependency will
 * be stripped in future versions. Content intended for injection should have
 * a minimum footprint, so defining the jquery library is too expensive.
 *
 * This script assumes you have defined a div on the page with the ID "wrapper".
 * The wrapper is used to determine the proper height of the iframe, and it
 * should wrap all the visible content.
 *
 **/
 

/**
 * Set the defaults.
 */
jQuery(document).ready(function(){
    
    //defined in network_service.js
    getContent();
    
    // Creates a tooptip which indicates the content is not a 
    // natural element of the page
    iframeBehavior.tooltip();
    
    // Tells the parent document how tall the iframe is so that
    // the iframe height can be changed to its content's height
    iframeBehavior.resize();
    
    // Click behavior is determined by the permissions the user has on the 
    // content. By default, the user does not have editing permissions,
    // but you can change the defaults in the permissions object.
    if ( iframeBehavior.permissions.canupdate ) {
        iframeBehavior.tooltipMessage = "Privly Writable (Double Click)";
    } 
    
    jQuery("body").on("click",iframeBehavior.click);
});

/**
 * @namespace
 * Wrapper for behaviors required of injectable applications.
 */
var iframeBehavior = {
    
    /**
     * Defines what the user is permissioned to do on the content.
     * This object is assigned when the content is fetched by AJAX request.
     *
     * These settings are used by all injected applications for the Tooltip,
     * but they could have specific meaning every injected applicaiton.
     *
     */
    permissions: {
      canshow: true, 
      canupdate: false, 
      candestroy: false,
      canshare: false
    },
    
    /**
     * Message displayed by the tooltip.
     */
    tooltipMessage: "Read Only (Privly)",

    /**
     * Tooltip script 
     * powered by jquery (http://www.jquery.com)
     * written by Alen Grakalic (http://cssglobe.com)
     * for more info visit http://cssglobe.com/post/1695/easiest-tooltip-and-image-preview-using-jquery
     */
    tooltip: function(){

      var tooltipMessageElement = "<p id='tooltip'>" + iframeBehavior.tooltipMessage + "</p>";
      
      var xOffset = 7;
      var yOffset = 10;
      jQuery("body").hover(function(e){
        jQuery("body").append(tooltipMessageElement);
        jQuery("#tooltip").css("top",(e.pageY - xOffset) + "px").css("left",(e.pageX + yOffset) + "px").fadeIn("fast").text(iframeBehavior.tooltipMessage);    
        },
        function(){
            jQuery("#tooltip").remove();
        });
      jQuery("body").mousemove(function(e){
        jQuery("#tooltip").css("top",(e.pageY - xOffset) + "px").css("left",(e.pageX + yOffset) + "px").text(iframeBehavior.tooltipMessage);
      });
    },
    
    /**
     * Opens the injected content in a new window. If the user clicked a link
     * in the injected content, the link is followed.
     */
    click: function(evt)
    {
        iframeBehavior.clickCount = 0;
        
        if(evt.target.nodeName == "A"){
          parent.window.location = evt.target.href;
        }
        else{
          window.open(webApplicationURL, '_blank');
        }  
    },
    
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
     *
     */
    resize: function() {
        iframeBehavior.dispatchResize(15);
        jQuery("body").attr("height","100%");
        
        var newHeight = document.getElementById("wrapper").offsetHeight;
       
        newHeight = newHeight + 18; // add 18px just to accommodate the tooltip
        iframeBehavior.dispatchResize(newHeight);
    }
};
