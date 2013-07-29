/**
 * @fileOverview options.js loads options from local storage to
 * initialize forms, and saves updates to the options.
 *
 * Available options include setting the some-trust whitelisted domains 
 * and the server the user uploads their content to when generating new
 * injectable links.
 *
 * For more information about the whitelist, read:
 * https://github.com/privly/privly-organization/wiki/whitelist
 *
 * Local Storage Bindings Used:
 *
 * - user_whitelist_csv: This is the string of text the user gives the extension
 *   to specify which servers they trust to automatically inject into the host
 *   page. This string is presented to the user every time they visit options,
 *   but the string used by the content script is user_whitelist_regexp
 *
 * - user_whitelist_regexp: This string is formatted specifically so that 
 *   privly.js can update its whitelist regexp.
 *
 * - posting_content_server_url: The content server the user will post to
 *   when generating new content.
 *
 * - privly_glyph: A consistent visual identifier to prevent spoofing.
 *   It is stored as series of hex colors stated
 *   without the leading hash sign, and separated by commas. 
 *   eg: ffffff,f0f0f0,3f3f3f
 *
 */

/**
 * Saves user's custom whitelist to localStorage.
 */
function saveWhitelist() {
  
  var user_whitelist_input = document.getElementById("user_whitelist_csv");
  
  // characters to split entered domains on
  var invalid_chars = new RegExp("[^a-zA-Z0-9\-._]","g"); 
  var domains = user_whitelist_input.value.split(invalid_chars); 

  // Each subdomain can be from 1-63 characters and may contain alphanumeric 
  // characters, - and _ but may not begin or end with - or _
  // Each domain can be from 1-63 characters and may contain alphanumeric 
  // characters and - but may not begin or end with - Each top level domain may
  // be from 2 to 9 characters and may contain alpha characters
  var validateSubdomain = new RegExp("^(?!\-|_)[\\w\-]{1,63}","g"); //subdomains
  var validateDomain = new RegExp("^(?!\-)[a-zA-Z0-9\-?]{1,63}$","g"); //domain
  var validateTLD = new RegExp("^[a-zA-Z]{2,9}$","g"); //top level domain
  
  //needed because js regex does not have look-behind
  var notEndInHyphenOrUnder = new RegExp("[^\-_]$","g"); 
  var notEndInHyphen = new RegExp("[^\-]$","g");

  var domain_regexp = "";  //stores regex to match validated domains
  var valid_domains = [];  //stores validated domains
  
  //iterate over entered list, split by invalid chars
  for (var i = 0; i < domains.length; i++){ 
    var parts = domains[i].split(".");
    var valid_parts_count = 0;
    
    //iterate over domains, split by .
    for (var j = 0; j < parts.length; j++){ 
      switch (j){
      case parts.length-1: // validate TLD
        if (parts[j].match(validateTLD)){ 
            valid_parts_count++;
        }
        break;
      case parts.length-2: // validate Domain
        if (parts[j].match(validateDomain) &&
            parts[j].match(notEndInHyphen) ){ 
          valid_parts_count++;
        }
        break;
      default: // validate Subdomain(s)
        if (parts[j].match(validateSubdomain) && 
            parts[j].match(notEndInHyphenOrUnder)){ 
          valid_parts_count++;
        }
        break;
      }
    }
    //if all parts of domain are valid
    //append to regex for restricting domains of injected content
    if (valid_parts_count === parts.length && parts.length > 1){
      domain_regexp += "|" + domains[i].toLowerCase() + "\\/";
      valid_domains.push(domains[i].toLowerCase());
    }
  }
  var whitelist_csv = valid_domains.join(" , "); 
  localStorage["user_whitelist_csv"] = whitelist_csv;
  localStorage["user_whitelist_regexp"] = domain_regexp;
  
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
    
    //forces refresh, erases invalid domains in text box
    document.location.reload();
  }, 750);
}


/**
 * Restores select box state to saved value from localStorage.
 */
function restoreWhitelist() {
  
  restore_server();
  
  var user_whitelist_csv = localStorage["user_whitelist_csv"];
  if (!user_whitelist_csv) {
    return;
  }
  var input = document.getElementById("user_whitelist_csv");
  input.value = user_whitelist_csv;
}


/**
 * Restores the current content server setting.
 */
function restore_server(){
  
  var posting_content_server_url = localStorage["posting_content_server_url"];
  
  // check for local storage content
  if (!posting_content_server_url) {
    return;
  
  } else {
    
    // check content type and restore
    switch(posting_content_server_url){
      
      //diplay the on menu
      case "https://privlyalpha.org":
        
        var alpha_input = document.getElementById("server_form");
        alpha_input.style.display = "block";
        var alpha = document.getElementById("alpha");
        alpha.checked = true;
        break;
      
      // display the on menu
      case "https://dev.privly.org":
        var dev_input = document.getElementById("server_form");
        dev_input.style.display = "block";
        var dev = document.getElementById("dev");
        dev.checked = true;
        break;
      
      // diplay the on menu
      case "http://localhost:3000":
        var local_input = document.getElementById("server_form");
        local_input.style.display = "block";
        var local = document.getElementById("local");
        local.checked = true;
        break;
      
      // user defined data
      default:
      
        // diplay the on menu
        var other_input = document.getElementById("server_form");
        other_input.style.display = "block";
      
        // diplay the other sub menu
        var user_input = document.getElementById("user");
        user_input.style.display = "block";
        var other = document.getElementById("other");
        other.checked = true;
      
        // populate the text box
        var other_content_server = document.getElementById("other_content_server");
        other_content_server.value = posting_content_server_url;
      
        var button = document.getElementById("save_server"); 
        button.style.display = "block";
      
    }
  }
}

/**
 * Save the current content server setting.
 *
 * @param {event} event the save button's click event.
 *
 */
function saveServer(event){
  
  // fired event object
  var target = event.target;
  
  // reset status
  var status = document.getElementById("server_status");
  status.innerHTML = "";
  
  // hide sub menu text box if not selected
  if(target.id != "save_server") {
    var other = document.getElementById("user");
    other.style.display = "none";
    var button = document.getElementById("save_server"); 
    button.style.display = "none";    
  }
  
  // determine event
  switch(target.id) {
    
    // diplay the on menu
    case "on":
      var on_input = document.getElementById("server_form");
      on_input.style.display = "block";
      break;
    
    case "alpha":
      localStorage["posting_content_server_url"] = "https://privlyalpha.org";
      break;
    
    case "dev":
      localStorage["posting_content_server_url"] = "https://dev.privly.org";
      break;
    
    case "local":
      localStorage["posting_content_server_url"] = "http://localhost:3000";
      break;
    
    // open sub menu
    case "other":
      var button = document.getElementById("save_server"); 
      button.style.display = "block";    
      var other = document.getElementById("user");
      other.style.display = "block";
      break;
    
    // save user entered content server
    case "save_server":
      var other_content_server = document.getElementById("other_content_server");
      var input = other_content_server.value;
      
      // validate user entered content server and 
      if(validateContentServer(input)){
        localStorage["posting_content_server_url"] = input;
        
        // Update server status to let user know options were saved.
        status.innerHTML = "Content Server Saved.";
        setTimeout(function() {
          status.innerHTML = "";
        }, 750);
      
      } else {
        alert("Content Server not saved. please check input format.");
      }
      
      break;
    
    //default case is that the content server is set to the default position
    default:
    
      //hide menus
      var menu = document.getElementById("server_form");
      menu.style.display = "none";
      var sub_menu = document.getElementById("user");
      sub_menu.style.display = "none";
      var button = document.getElementById("save_server"); 
      button.style.display = "none";
      localStorage["posting_content_server_url"] = "https://privlyalpha.org";
    
  }
}

/**
 * Validates whether the URL is reachable with an HTTP request.
 *
 * @return {boolean} A boolean indicating whether the extension
 * successfully connected to the content server.
 *
 */
function validateContentServer(url) {

  //default http success value
  var request_success = 200;
  
  //update status of content server
  var status = document.getElementById("server_status");
  
  //check for internet connection
  var connection_check = navigator.onLine;
  if(connection_check){
    try{
      
      //create http object and request server
      var request = new XMLHttpRequest();
      request.open("GET", url, false);
      request.send(null);
      
      if(request.status === request_success){
        return true;
      }  else {
        status.innerHTML = "Verification Failed.";
        return false;
      }
      
    //catch http request exception 101 for network error
    } catch(e){
      status.innerHTML = "Verification Failed.";
      return false;
    }
    
  //if no connection is present then verification can not be made 
  }else{
    alert("No Connection: Please connect to the internet if you want to"
            + "change your content server");
  }

}

/**
 * Sets the listeners on the UI elements of the page.
 */
function listeners(){
  
  //Glyph generation
  document.querySelector('#regenerate_glyph').addEventListener('click', regenerateGlyph);
  
  // Options save button
  document.querySelector('#save').addEventListener('click', saveWhitelist);
  
  // Run Tests button
  document.querySelector('#run_tests').addEventListener('click', function(){
    chrome.windows.create({url:"background.html"});
  });
  
  // content server menu listeners
  document.querySelector('#alpha').addEventListener('click', saveServer);
  document.querySelector('#dev').addEventListener('click', saveServer);
  document.querySelector('#local').addEventListener('click', saveServer);
  document.querySelector('#other').addEventListener('click', saveServer);
  document.querySelector('#save_server').addEventListener('click', saveServer);
}

/**
 * Generate a new color glyph unique to this extension. The generated string
 * should only be used for the anti-spoofing glyph. The resulting string is
 * not cryptographically secure.
 */
function regenerateGlyph() {
  localStorage["privly_glyph"] = Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16) + "," +
    Math.floor(Math.random()*16777215).toString(16);
  document.location.reload();
}

/**
 * Creates the security glyph for the page as a series of random colors.
 * The glyph is represented as a row of colors defined in local storage.
 * The row is written as a table and assigned to the div element glyph_table.
 */
function writeGlyph() {

  var glyphString = localStorage["privly_glyph"];
  var glyphArray = glyphString.split(",");

  for(var i = 0; i < glyphArray.length; i++) {
    var rule = '.glyph' + i + '{background-color:#' + glyphArray[i] +'}';
    document.styleSheets[0].insertRule(rule,0);
  }

  var table = '<table dir="ltr" width="100" border="0" ' +
        'summary="Privly Visual Security Glyph">' +
    '<tbody>' +
      '<tr>';
  for(i = 0; i < glyphArray.length; i++) {
    table += '<td class="glyph' + i + '">&nbsp;&nbsp;</td>';
  }
  table += '</tr>' +
    '</tbody>' +
  '</table>';
  
  document.getElementById("glyph_table").innerHTML = table;
}

// Save updates to the white list
document.addEventListener('DOMContentLoaded', restoreWhitelist);

// Listen for UI events
document.addEventListener('DOMContentLoaded', listeners);

// Write the spoofing glyph to the page
document.addEventListener('DOMContentLoaded', writeGlyph);
