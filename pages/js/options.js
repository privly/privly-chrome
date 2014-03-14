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
  var csv = "";
  url_inputs = document.getElementsByClassName('whitelist_url');
  for( i=0; i<url_inputs.length; i++ ){
    if(url_inputs[i].value.length >0)
    csv += url_inputs[i].value.replace(/.*?:\/\//g, "")+",";
  }

  var user_whitelist_input = csv;
  
  // characters to split entered domains on
  var invalid_chars = new RegExp("[^a-zA-Z0-9\-._]","g"); 
  var domains = user_whitelist_input.split(invalid_chars); 

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
  var user_whitelist = user_whitelist_csv.split(',');
  for(i=1; i <= user_whitelist.length - 2; i++)
    addUrlInputs();
  var inputs = document.getElementsByClassName("whitelist_url");
  for(i=0; i< user_whitelist.length; i++)
    inputs[i].value = user_whitelist[i].replace(/ /g,''); // Replaces trailing whitespaces, if any
}


/**
 * Restores the current content server setting.
 */
function restore_server(){
  
  var posting_content_server_url = localStorage["posting_content_server_url"];
  var server_input = document.getElementById("content_server_url");
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
        server_input.selectedIndex = 0;
        break;
      
      // display the on menu
      case "https://dev.privly.org":
        var dev_input = document.getElementById("server_form");
        dev_input.style.display = "block";
        server_input.selectedIndex = 1;
        break;
      
      // diplay the on menu
      case "http://localhost:3000":
        var local_input = document.getElementById("server_form");
        local_input.style.display = "block";
        server_input.selectedIndex = 2;
        break;
      
      // user defined data
      default:
      
        // diplay the on menu
        var other_input = document.getElementById("server_form");
        other_input.style.display = "block";
      
        // diplay the other sub menu
        var user_input = document.getElementById("user");
        user_input.style.display = "inline";
        server_input.selectedIndex = 3;
      
        // populate the text box
        var other_content_server = document.getElementById("other_content_server");
        other_content_server.value = posting_content_server_url;
      
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
  if(target.value != "other") {
    var other = document.getElementById("user");
    other.style.display = "none";
  }
  
  // determine event
  switch(target.value) {
    
    // diplay the on menu
    case "on":
      var on_input = document.getElementById("server_form");
      on_input.style.display = "block";
      break;

    // open sub menu
    case "other":
      var other = document.getElementById("user");
      other.style.display = "inline";
      break;
    
    // save user entered content server
    case "save_server":
      var server_selected = document.getElementById("content_server_url").value;
      if(server_selected)
      switch(server_selected){
        case "other" :  
          var other_content_server = document.getElementById("other_content_server");
          var input = other_content_server.value;
          // validate user entered content server and 
          if(validateContentServer(input) && input.length != 0){
            localStorage["posting_content_server_url"] = input;
          } else {
            alert("Content Server not saved. please check input format.");
          }
          break;

        case "alpha":
          localStorage["posting_content_server_url"] = "https://privlyalpha.org";
          status.innerHTML = "Content Server Saved.";
          break;
    
        case "dev":
          localStorage["posting_content_server_url"] = "https://dev.privly.org";
          status.innerHTML = "Content Server Saved.";
          break;
    
        case "local":
          localStorage["posting_content_server_url"] = "http://localhost:3000";
          status.innerHTML = "Content Server Saved.";
          break;     
      }

      // Update server status to let user know options were saved.
      setTimeout(function() {
        status.innerHTML = "";
      }, 750);
    
      break;
    
    //default case is that the content server is set to the default position
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
    
  // content server menu listeners
  document.querySelector('#content_server_url').addEventListener('change', saveServer);
  document.querySelector('#save_server').addEventListener('click', saveServer);
  document.querySelector('#add_more_urls').addEventListener('click', addUrlInputs);
  document.querySelector('body').addEventListener('click', removeUrlInputs); 
  // Click on body explicitly used to tackle dynamically created inputs as well
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
  writeGlyph();
}

/**
 * Creates the security glyph for the page as a series of random colors.
 * The glyph is represented as a row of colors defined in local storage.
 * The row is written as a table and assigned to the div element glyph_table.
 */
function writeGlyph() {
  
  var glyphString = localStorage["privly_glyph"];
  var glyphArray = glyphString.split(",");
  
  var table = '<table class="glyph" dir="ltr" width="100" border="0" ' +
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
  
  for(var i = 0; i < glyphArray.length; i++) {
    $('.glyph' + i).css({"background-color": '#' + glyphArray[i]});
  }

}

/**
 * Adds an input text element in white list form for each call.
 */
function addUrlInputs () {
  var input = document.createElement('input');
  var parent = document.createElement('div');
  var remove = document.createElement('span');

  remove.className = "glyphicon glyphicon-remove remove_whitelist";
  input.type = "text";
  input.className = "whitelist_url form-control";
  parent.appendChild(input);
  parent.innerHTML += " ";
  parent.appendChild(remove);
  document.getElementById('urls').appendChild(parent);
}

/**
 * Removes the input text element of which remove has been caled.
 */
function removeUrlInputs (event) {
  target = event.target;
  if(target.className.indexOf('remove_whitelist') >=0) {
    target.parentElement.remove();
  }
}
// Save updates to the white list
document.addEventListener('DOMContentLoaded', restoreWhitelist);

// Listen for UI events
document.addEventListener('DOMContentLoaded', listeners);

// Write the spoofing glyph to the page
document.addEventListener('DOMContentLoaded', writeGlyph);
