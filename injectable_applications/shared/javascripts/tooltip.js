/**
 * @fileOverview This script defines a tooltip to indicate that the content is
 * not a natural element of the page.
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
 * This script assumes that jquery is defined, but this dependency will
 * be stripped in future versions. Content intended for injection should have
 * a minimum footprint, so defining the jquery library is too expensive.
 *
 **/
 
 
/**
 * @namespace
 * Wrapper for tooltip functions.
 */
var privlyTooltip = {
    
    /**
     * Message displayed by the tooltip.
     */
    tooltipMessage: "Read Only (Privly)",
    
    /**
     * Updates the tooltip's message.
     *
     * @param {string} newMessage The message to change the tooltip to.
     *
     */
    updateMessage: function(newMessage){
      privlyTooltip.tooltipMessage = newMessage;
    },
    
    /**
     * Tooltip script 
     * powered by jquery (http://www.jquery.com)
     * written by Alen Grakalic (http://cssglobe.com)
     * for more info visit http://cssglobe.com/post/1695/easiest-tooltip-and-image-preview-using-jquery
     */
    tooltip: function(){
      
      var tooltipMessageElement = "<p id='tooltip'>" + privlyTooltip.tooltipMessage + "</p>";
      
      var xOffset = 7;
      var yOffset = 10;
      jQuery("body").hover(function(e){
        jQuery("body").append(tooltipMessageElement);
        jQuery("#tooltip").css("top",(e.pageY - xOffset) + "px").css("left",(e.pageX + yOffset) + "px").fadeIn("fast").text(privlyTooltip.tooltipMessage);    
        },
        function(){
            jQuery("#tooltip").remove();
        });
      jQuery("body").mousemove(function(e){
        jQuery("#tooltip").css("top",(e.pageY - xOffset) + "px").css("left",(e.pageX + yOffset) + "px").text(privlyTooltip.tooltipMessage);
      });
    },
    
};
