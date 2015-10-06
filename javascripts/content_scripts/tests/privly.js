/**
 * @fileOverview tests.js Gives testing code for the privly.js content script.
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Privly.js Suite", function() {

  // Create the expected DOM
  beforeEach(function() {
    var domIDs = [
      "tmp"
    ];
    domIDs.forEach(function(id){
      var newElement = $('<a/>', {
        id: id,
      });
      $(document.body).append(newElement);
    });
  });

  // Remove the expected DOM
  afterEach(function() {
    document.body.innerHTML = "";
  });

  it("tests something", function() {
    expect(true).toBe(true);
  });

});
