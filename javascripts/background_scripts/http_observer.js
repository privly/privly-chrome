/**
 * @fileOverview Set the Privly version number as a header on all requests.
 *
 * This header will become important in subsequent versions of the Privly
 * extensions. Custom headers increase the identifiability of users,
 * and should not be incremented unless all users will reliably update their
 * extensions in a timely fashion. This header will not be updated unless
 * content servers must distinguish versions.
 */

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    details.requestHeaders.push({name:'X-Privly-Version', value:'0.0.7'});
    return {requestHeaders: details.requestHeaders};
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestHeaders"]);
