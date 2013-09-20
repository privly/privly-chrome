/**
 *
 * WARNING: This is a modified version of the tooltip script intended for 
 * demonstration purposes only. Look for the real script here:
 * https://github.com/privly/privly-applications/blob/master/shared/javascripts/tooltip.js
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
    tooltipMessage: "This will be your Privly Glyph",
    
    /**
     * Tooltip script 
     * powered by jquery (http://www.jquery.com)
     * written by Alen Grakalic (http://cssglobe.com)
     * for more info visit http://cssglobe.com/post/1695/easiest-tooltip-and-image-preview-using-jquery
     */
    tooltip: function(){
      
      var glyph = privlyTooltip.glyphHTML();
      var tooltipMessageElement = "<p>" + privlyTooltip.tooltipMessage + "</p>" + glyph;
      jQuery("#tooltip").html("<p>" + privlyTooltip.tooltipMessage + "</p>" + glyph);
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
