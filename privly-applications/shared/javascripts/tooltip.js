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
    tooltipMessage: "Read Only",
    
    /**
     * Updates the tooltip's message.
     *
     * @param {string} newMessage The message to change the tooltip to. A
     * limited set of characters are accepted: 
     * digits, word characters, underscores (\w) and whitespace (\s), periods,
     * and colons.
     *
     */
    updateMessage: function(newMessage){
      var message = newMessage.replace(/[^\w\s.:]/gi, '');
      privlyTooltip.tooltipMessage = message;
    },
    
    /**
     * Tooltip script 
     * powered by jquery (http://www.jquery.com)
     * written by Alen Grakalic (http://cssglobe.com)
     * for more info visit http://cssglobe.com/post/1695/easiest-tooltip-and-image-preview-using-jquery
     */
    tooltip: function(){
      
      var glyph = privlyTooltip.glyphHTML();
      var tooltipMessageElement = "<div id='tooltip'><p>" + privlyTooltip.tooltipMessage + "</p>" + glyph + "</div>";
      
      var xOffset = 7;
      var yOffset = 10;
      jQuery("body").hover(function(e){
        jQuery("body").append(tooltipMessageElement);
        jQuery("#tooltip").css("top", (e.pageY - xOffset) + "px")
                          .css("left", (e.pageX + yOffset) + "px")
                          .fadeIn("fast")
                          .html("<p>" + privlyTooltip.tooltipMessage + "</p>" + glyph);    
        },
        function(){
            jQuery("#tooltip").remove();
        });
      jQuery("body").mousemove(function(e){
        jQuery("#tooltip").css("top", (e.pageY - xOffset) + "px")
                          .css("left", (e.pageX + yOffset) + "px")
                          .html("<p>" + privlyTooltip.tooltipMessage + "</p>" + glyph);
      });
    },
    
    /**
     * Constructs the user's security glyph, which indicates whether the 
     * injected content is trusted. The Glyph is assumed to be defined by the
     * extension before this script is run. It can be reset via the options
     * interface.
     *
     * The glyph is currently defined by a string in 
     * localStorage["privly_glyph"], that is a series of hex colors stated
     * without the leading hash sign, and separated by commas.
     *
     * eg: ffffff,f0f0f0,3f3f3f
     *
     * @return {string} An HTML table of the glyph.
     *
     */
    glyphHTML: function() {
      
      //Add the CSS for the glyph
      var glyphString = localStorage["privly_glyph"];
      if (localStorage.getItem("privly_glyph") === null) {
        glyphString = "000000,000000,000000,000000,000000";
      }
      
      var glyphArray = glyphString.split(",");
      for(var i = 0; i < glyphArray.length; i++) {
        var rule = '.glyph' + i + '{background-color:#' + glyphArray[i] +'}';
        document.styleSheets[0].insertRule(rule,0);
      }
      
      //Construct the HTML glyph table
      var table = '<table dir="ltr" width="100" border="0" ' +
                    'summary="Privly Visual Security Glyph">' +
                      '<tbody>' +
                        '<tr>';
      for(i = 0; i < glyphArray.length; i++) {
        table +=          '<td class="glyph' + i + '">&nbsp;&nbsp;</td>';
      }
      table +=          '</tr>' +
                      '</tbody>' +
                  '</table>';
      return table;
    }
};
