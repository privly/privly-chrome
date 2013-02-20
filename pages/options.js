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
 */

/**
 * Saves options to localStorage.
 */
function saveOptions() {
  
  var user_whitelist_input = document.getElementById("user_whitelist_csv");
  var invalid_chars = new RegExp("[^a-zA-Z0-9\-._]","g"); // characters to split entered domains on
  var domains = user_whitelist_input.value.split(invalid_chars); 

  /*  Each subdomain can be from 1-63 characters and may contain alphanumeric characters, - and _ 
          but may not begin or end with - or _
      Each domain can be from 1-63 characters and may contain alphanumeric characters and - 
          but may not begin or end with -
      Each top level domain may from 2 to 9 characters and may contain alpha characters
  */
  var validateSubdomain = new RegExp("^(?!\-|_)[\\w\-]{1,63}","g"); //regex to match subdomains
  var validateDomain = new RegExp("^(?!\-)[a-zA-Z0-9\-?]{1,63}$","g"); //regex to match primary domain
  var validateTLD = new RegExp("^[a-zA-Z]{2,9}$","g"); //regex to match top level domain

  var notEndInHyphenOrUnder = new RegExp("[^\-_]$","g"); //needed because js regex does not have look-behind
  var notEndInHyphen = new RegExp("[^\-]$","g"); //needed because js regex does not have look-behind

  var domain_regexp = "";  //stores regex to match validated domains
  var valid_domains = [];  //stores validated domains

  for (var i = 0; i < domains.length; i++){ //iterate over entered list, split by invalid chars
    var parts = domains[i].split(".");
    var valid_parts_count = 0;
    for (var j = 0; j < parts.length; j++){ //iterate over domains, split by .
      switch (j){
      case parts.length-1: // validate TLD
        if (parts[j].match(validateTLD)){ 
            valid_parts_count++;
        }
        break;
      case parts.length-2: // validate Domain
        if (parts[j].match(validateDomain) && parts[j].match(notEndInHyphen) ){ 
          valid_parts_count++;
        }
        break;
      default: // validate Subdomain(s)
        if (parts[j].match(validateSubdomain) && parts[j].match(notEndInHyphenOrUnder)){ 
          valid_parts_count++;
        }
        break;
      }
    }
    if (valid_parts_count === parts.length && parts.length > 1){ //if all parts of domain are valid
      domain_regexp += "|" + domains[i].toLowerCase() + "\\/"; //append to regex for restricting domains of injected content
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
    document.location.reload() //forces refresh, erases invalid domains in text box
  }, 750);
}


/**
 * Restores select box state to saved value from localStorage.
 */
function restoreOptions() {
  
  restore_server();
  
  var user_whitelist_csv = localStorage["user_whitelist_csv"];
  if (!user_whitelist_csv) {
    return;
  }
  var input = document.getElementById("user_whitelist_csv");
  input.value = user_whitelist_csv;
}


/**
 * Restores the current content server setting
 */
function restore_server(){
  
  var posting_content_server_url = localStorage["posting_content_server_url"];
  
  // check for local storage content
  if (!posting_content_server_url) {
    return;
  
  } else {
    
    // check conten type and restore
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
      //remove the local storage
      localStorage.removeItem("posting_content_server_url");
    
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
  
  // Options save button
  document.querySelector('#save').addEventListener('click', saveOptions);
  
  // content server listeners
  document.querySelector('#on').addEventListener('click', saveServer);
  document.querySelector('#off').addEventListener('click', saveServer);
  
  // content server sub menu listerners
  document.querySelector('#alpha').addEventListener('click', saveServer);
  document.querySelector('#dev').addEventListener('click', saveServer);
  document.querySelector('#local').addEventListener('click', saveServer);
  document.querySelector('#other').addEventListener('click', saveServer);
  document.querySelector('#save_server').addEventListener('click', saveServer);
}

// Save updates to the white list
document.addEventListener('DOMContentLoaded', restoreOptions);

// Listen for UI events
document.addEventListener('DOMContentLoaded', listeners);
