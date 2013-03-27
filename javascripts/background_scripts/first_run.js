/**
 * @fileOverview This file opens a tab with the first run html doc under
 * appropriate conditions when the extension is loaded on browser launch or
 * install.
 * 
 * Appropriate conditions fall under two circumstances:
 * 1. LocalStorage does not have a stored value for the version of privly
 *    installed. (Privly was just installed or localStorage was cleared)
 * 2. The version stored in the manifest differs from the version stored in
 *    localStorage. (Privly was updated)
 *
 **/

// get version stored in the manifest
function getPrivlyVersion(){ 
  var details = chrome.app.getDetails();
  //console.log("Manifest contains", details.version);
  return details.version;
}
// get version stored in localStorage
function getStoredVersion(){
  var stored_version = localStorage["version"];
  //console.log("Local Storage contains", stored_version);
  return stored_version;
}
// Update localStorage version
function update_version(version){
  //console.log("Setting version to", version);
  localStorage["version"] = version;
}
// open a tab with the local first_run.html
function firstrun(){
  var page = chrome.extension.getURL("pages/first_run.html");
  chrome.tabs.create( {url: page} );
}

function run_firstrun(){
  var running_version = getPrivlyVersion();
  var last_run_version = getStoredVersion();

  if (last_run_version === null || running_version !== last_run_version ) {
    firstrun();
    update_version(running_version);
  }
  else {
    //console.log("Version set in local storage and matches running version");
  }
}
run_firstrun()

