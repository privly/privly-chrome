/**
 * Saves options to localStorage.
 */
function save_options() {
  
  var user_whitelist_input = document.getElementById("user_whitelist_csv");
  var whitelist_unformatted = user_whitelist_input.value;
  var whitelist_escaped = whitelist_unformatted.replace(".", "\\.");
  var domains = whitelist_escaped.split(",");
  var domain_regexp = "";
  for (var i = 0; i < domains.length; i++){
    domain_regexp += "|" + domains[i] + "\\/";
  }
  
  localStorage["user_whitelist_csv"] = whitelist_unformatted;
  localStorage["user_whitelist_regexp"] = domain_regexp;
  
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = "Options Saved.";
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

/**
 * Restores select box state to saved value from localStorage.
 */
function restore_options() {
  var user_whitelist_csv = localStorage["user_whitelist_csv"];
  if (!user_whitelist_csv) {
    return;
  }
  var input = document.getElementById("user_whitelist_csv");
  input.value = user_whitelist_csv;
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);
