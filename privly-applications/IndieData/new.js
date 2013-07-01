/**
 * @fileOverview Manages the importation of data into local storage on the
 * browser and accepts search strings from the browser extension.
 *
 * WARNING: Rough hacks be here. This Injectable Application was built in
 * a few hours as a proof of concept for maintaining local storage of
 * personal semantic data.
 *
 **/

/**
 * Attempt to submit the content to the content server, then fire the URL
 * event for the extension to capture.
 */
function importLinkedIn() {
  
  //parse and save emails
  var csv = $("#content")[0].value;
  var lines = csv.split("\n");
  var people = {people: []};
  var headings = lines[0].split(",");
  
  //collect headings
  for (var y = 0; y < headings.length; y++) {
    headings[y] = headings[y].substring(1,headings[y].length - 1);
  }
  
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    var personArray = line.split(",");
    //collect people
    var person = {};
    for (var y = 0; y < personArray.length; y++) {
      person[headings[y]] = personArray[y].substring(1,personArray[y].length - 1);
    }
    
    people.people.push(person);
    
  }
  
  //produces {people: [{"E-mail Address":"email@email.com", "First Name":"first name", "Last Name":"last name"}, ...]}
  localStorage["IndieDataPeople"] = JSON.stringify(people);
}

/**
 * Take a name from the extension and loock for it in local storage.
 */
function search(name) {
  if(localStorage["IndieDataPeople"] === undefined) {
    return;
  }
  
  var people = JSON.parse(localStorage["IndieDataPeople"]).people;
  var matches = [];
  
  for (var i = 0; i < people.length; i++) {
    var person = people[i];
    var email = person["E-mail Address"];
    var firstName = person["First Name"];
    var lastName = person["Last Name"];
    if(lastName.indexOf(name) != -1 ||
      firstName.indexOf(name) != -1 ||
      email.indexOf(name) != -1) {
      matches.push(person);
    }
  }
  
  if(matches.length === 1) {
    sendEmail(matches[0]["E-mail Address"]);
  }
  
  $("#SearchTable").append("<tr><td><strong>First Name</strong></td><td><strong>Last Name</strong></td><td><strong>Email</strong></td></tr>");
  for ( var i = 0; i < matches.length; i++) {
    $("#SearchTable").append("<tr><td class='datum'>" + matches[i]["First Name"] + 
                             "</td><td class='datum'>" + matches[i]["Last Name"] + 
                             "</td><td class='datum'>" + matches[i]["E-mail Address"] + 
                             "</td></tr>");
  }
  
  // Send the string of any contact that is clicked back to the extension.
  $(".datum").click(function() {
    sendEmail($(this).text());
  });
}

/**
 * Callback defined for handling the return of posting new content
 * 
 * @param json json response from remote server.
 */
function sendEmail(emailAddress) {
  privlyExtension.firePrivlyURLEvent(emailAddress);
}

/**
 * Sets the listeners on the UI elements of the page.
 */
function listeners() {
  
  //updating data store
  document.querySelector('#save').addEventListener('click', importLinkedIn);
  
  // Listener for 
  privlyExtension.initialContent = function(data) {
    search(data.initialContent);
  }
  
  privlyExtension.messageSecret = function(data) {
    privlyExtension.messageExtension("initialContent", "");
  }
  
  // Initialize message pathway to the extension.
  privlyExtension.firePrivlyMessageSecretEvent();
  
}

// Listen for UI events
document.addEventListener('DOMContentLoaded', listeners);
