/**
 * @fileOverview This file opens a tab with the first run html doc under
 * appropriate conditions when the extension is loaded on browser launch or
 * on extension install.
 * 
 * Appropriate conditions fall under two circumstances:
 * 1. LocalStorage does not have a stored value for the version of privly
 *    installed. (Privly was just installed or localStorage was cleared)
 * 2. The version stored in the manifest differs from the version stored in
 *    localStorage. (Privly was updated)
 *
 **/

/**
 * Get version stored in the manifest
 */
function get_privly_version(){ 
  var details = chrome.app.getDetails();
  return details.version;
}

/**
 * Get version stored in localStorage
 */
function get_stored_version(){
  var stored_version = localStorage["version"];
  return stored_version;
}

/**
 * Update localStorage version
 */
function update_version(version){
  localStorage["version"] = version;
}

/** 
 * open a window with the local first_run.html and ensures the localStorage
 * variables are assigned.
 */
function firstrun(){
  
  var postingDomain = localStorage["posting_content_server_url"];
  if (postingDomain === undefined || postingDomain === null) {
    localStorage["posting_content_server_url"] = "https://privlyalpha.org";
  }
  
  var page = chrome.extension.getURL("pages/first_run.html");
  chrome.windows.create({url: page, focused: true,
                         width: 1100,
                         top: 0, left: 0, type: "popup"}, 
                         function(newWindow){});
  return "Done";
}

/**
 * Check whether the first run html page should be opened.
 */
function run_firstrun(){
  
  var running_version = get_privly_version();
  var last_run_version = get_stored_version();

  if (last_run_version === null || running_version !== last_run_version ) {
    
    // minor update, don't show popup if they already had 0.3.2
    if(last_run_version !== "0.3.2" && running_version !== "0.3.3") firstrun();
    update_version(running_version);
  }
}

// Initialize the spoofing glyph
// The generated string is not cryptographically secure and should not be used
// for anything other than the glyph.
if (localStorage["privly_glyph"] === undefined) {
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
}

run_firstrun();
