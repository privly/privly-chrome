/**
 * @fileOverview Gives testing code for the network_service.js shared library.
 *
 * This spec is managed by the Jasmine testing library.
 **/

describe ("Network Service Test Suite", function() {

 it("does not result in an error", function() {
   privlyNetworkService.permissions.canCreate = 
    privlyNetworkService.permissions.canCreate;
   privlyNetworkService.platformName();
   privlyNetworkService.getProtocolAndDomain();
   privlyNetworkService.contentServerDomain();
   expect(true).toBe(true);
 });

 it("sets the auth token string", function() {
   privlyNetworkService.setAuthTokenString("aaaa");
   expect(privlyNetworkService.authToken).toBe("auth_token=aaaa");
 });
 
 it("gets an auth tokenized url", function() {
   privlyNetworkService.setAuthTokenString("aaaa");
   var domain = privlyNetworkService.contentServerDomain();
   expect(
     privlyNetworkService.getAuthenticatedUrl(domain + "/pages/1?blam=wam"))
       .toBe(domain + "/pages/1?auth_token=aaaa&blam=wam");
   expect(
     privlyNetworkService.getAuthenticatedUrl(domain + "/pages/1?blam=wam"))
       .toBe(domain + "/pages/1?auth_token=aaaa&blam=wam");
   expect(
     privlyNetworkService.getAuthenticatedUrl(domain + "/pages/1?blam=wam#thanks"))
       .toBe(domain + "/pages/1?auth_token=aaaa&blam=wam#thanks");
   expect(
     privlyNetworkService.getAuthenticatedUrl(domain + "/pages/1#thanks"))
       .toBe(domain + "/pages/1?auth_token=aaaa#thanks");
   expect(
      privlyNetworkService.getAuthenticatedUrl(domain + "/pages/1#blam=wam"))
        .toBe(domain + "/pages/1?auth_token=aaaa#blam=wam");
 });
 
 it("does not change url", function() {
   
   // The urls should not change because the auth token is not set for them
   
   privlyNetworkService.setAuthTokenString("aaaa");
   expect(
     privlyNetworkService.getAuthenticatedUrl("https://fake.priv.ly/pages/1?blam=wam"))
       .toBe("https://fake.priv.ly/pages/1?blam=wam");
   expect(
     privlyNetworkService.getAuthenticatedUrl("https://fake.priv.ly/pages/1?blam=wam"))
       .toBe("https://fake.priv.ly/pages/1?blam=wam");
   expect(
     privlyNetworkService.getAuthenticatedUrl("https://fake.localhost:3000/pages/1?blam=wam#thanks"))
       .toBe("https://fake.localhost:3000/pages/1?blam=wam#thanks");
   expect(
     privlyNetworkService.getAuthenticatedUrl("https://fake.priv.ly/pages/1#thanks"))
       .toBe("https://fake.priv.ly/pages/1#thanks");
   expect(
      privlyNetworkService.getAuthenticatedUrl("https://fake.priv.ly/pages/1#blam=wam"))
        .toBe("https://fake.priv.ly/pages/1#blam=wam");
 });
 
 it("has the complete default whitelist", function() {
   expect(
     privlyNetworkService.isWhitelistedDomain("https://priv.ly"))
       .toBe(true);
   expect(
     privlyNetworkService.isWhitelistedDomain("https://privlyalpha.org"))
       .toBe(true);
   expect(
     privlyNetworkService.isWhitelistedDomain("https://privlybeta.org"))
       .toBe(true);
   expect(
     privlyNetworkService.isWhitelistedDomain("http://localhost:3000"))
       .toBe(true);
   expect(
      privlyNetworkService.isWhitelistedDomain("https://dev.privly.org/"))
        .toBe(true);
 });
 
 it("does not whitelist trick domains", function() {
   if( privlyNetworkService.platformName() === "HOSTED" ) return;
   
   expect(
     privlyNetworkService.isWhitelistedDomain("https://priv.ly.com"))
       .toBe(false);
   expect(
     privlyNetworkService.isWhitelistedDomain("howdyhttps://privlyalpha.org"))
       .toBe(false);
   expect(
     privlyNetworkService.isWhitelistedDomain("https://wam.privlybeta.org"))
       .toBe(false);
   expect(
     privlyNetworkService.isWhitelistedDomain("http://localhost:666"))
       .toBe(false);
   expect(
      privlyNetworkService.isWhitelistedDomain("https://newyork/"))
        .toBe(false);
 });
 
 it("shows the logged in nav", function() {
   if( typeof privlyHostPage === 'undefined' || privlyHostPage.isInjected() )
     return;
   privlyNetworkService.showLoggedInNav();
   expect($(".logged_in_nav").is(':visible')).toBe(true);
   expect($(".logged_out_nav").is(':hidden')).toBe(true);
 });
 
 it("shows the logged out nav", function() {
   privlyNetworkService.showLoggedOutNav();
   if( typeof privlyHostPage === 'undefined' || privlyHostPage.isInjected() )
     return;
   expect($(".logged_in_nav").is(':hidden')).toBe(true);
   expect($(".logged_out_nav").is(':visible')).toBe(true);
 });
 
 it("hides some elements on mobile", function() {
   if( privlyNetworkService.platformName() === "IOS" ||
       privlyNetworkService.platformName() === "ANDROID" ) {
     expect($(".mobile_hide").is(':hidden')).toBe(true);
   }
 });
 
 it("initializes navigation", function() {
   privlyNetworkService.initializeNavigation();
   var domain = privlyNetworkService.contentServerDomain();
   
   expect($(".home_domain").attr("href")).toBe(domain);
   expect($(".home_domain").text()).toBe(domain.split("/")[2]);
   expect($(".login_url").attr("href")).toBe(domain + "/users/sign_in");
   expect($(".account_url").attr("href")).toBe(domain + "/pages/account");
   expect($(".legal_nav").attr("href")).toBe(domain + "/pages/privacy");
   
   if( privlyNetworkService.platformName() === "HOSTED" ) {
     expect($(".home_domain").attr("target")).toBe("_self");
     expect($(".login_url").attr("target")).toBe("_self");
     expect($(".account_url").attr("target")).toBe("_self");
     expect($(".legal_nav").attr("target")).toBe("_self");
   }
 });
 
});
