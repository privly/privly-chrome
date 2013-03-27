function getPrivlyVersion() {
    var details = chrome.app.getDetails();
    console.log("Manifest contains", details.version);
    return details.version;
}
function getStoredVersion() {
    var stored_version = localStorage["version"];
    console.log("Local Storage contains", stored_version);
    return stored_version;
}
function update_version(version){
    console.log("Setting version to", version);
    localStorage["version"] = version;
}
function firstrun(){
    var page = chrome.extension.getURL("pages/first_run.html");
    chrome.tabs.create( {url: page} );
}

var running_version = getPrivlyVersion();
var last_run_version = getStoredVersion();

if (running_version !== last_run_version || last_run_version === null) {
    firstrun();
    update_version(running_version);
}
else {
    console.log("Version set in local storage and matches running version");
}
