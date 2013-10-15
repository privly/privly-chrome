/**
 * @fileOverview tests.js Gives testing code for when the application is
 * injected into another application.
 *
 * This spec is managed by the Jasmine testing library.
 **/
 
describe ("Host Page Integration Test Suite", function() {
  
  it("does not result in an error", function() {
    if( ! privlyHostPage.isInjected() ) return;
    
    // The runs function allows the testing library to complete the asynchronous
    // calls before executing this testing code
    runs(function() {
      privlyHostPage.dispatchResize(1000);
      privlyHostPage.dispatchResize(15);
      jQuery("body").attr("height","100%");
      var newHeight = document.getElementById("privlyHeightWrapper").offsetHeight;
      newHeight += 18; // add 18px just to accommodate the tooltip

      privlyHostPage.resizeToWrapper();
      expect(true).toBe(true);
    });
    
  });
  
});
