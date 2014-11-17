## About ##

Privly is a developing set of browser extensions for protecting content wherever it is posted on the internet. This extension allows users to view content on any website, without the host site being able to read the content. For more information on what Privly is, [read about us](https://priv.ly/pages/about).

## Development Status ##

**Alpha Version**

The Privly Chrome extension is currently maintained by [Sean McGregor](https://github.com/smcgregor), on behalf of the [Privly Foundation](http://www.privly.org).

## About this Extension ##

This extension currently supports:

* **Contextual Posting:** Posting to any website by right-clicking a form element.
* **Locally stored applications:** The Chrome extension runs no remote-code.
  * **PlainPost Application:** The [PlainPost][PlainPost] application supports content injection of web pages from **any** source domain. Note: the injected web pages do not include external media and code.
  * **ZeroBin Application:** The [ZeroBin][ZeroBin] application encrypts content with a key unique to the URL. Anyone with access to both the host page and the content server will be able to decrypt the content. Anyone without access to the server will be unable to decrypt the content.
* **Security glyph:** Every Chrome extension places a unique security glyph above Privly content when you hover over it.
* **Options Page:** The extension now has an options page that allows you to select content servers, add to a domain whitelist, and run automated code tests. 
* **User-defined Whitelists:** Users can now add domains to their "whitelist." This means any domain you trust to deliver content will be able to add a layer of privacy on top of your browsing experience.
* **Augmented Browsing Toggle:** When you turn off Privly, the web page you are viewing will be restored to the un-augmented view.
* **Message Interface to Compiled Code:** See the nacl branch of the repository.
* **Testing Library:** The Jasmine testing library is integrated with the extension.

## Testing/Submitting Bugs ##

Extension integration test cases are found at [test.privly.org](http://test.privly.org). If you have discovered a bug, only [open a public issue](https://github.com/privly/privly-chrome/issues/new) on GitHub if it could not possibly be a security related bug. If the bug affects the security of the system, please report it privately at [privly.org](http://www.privly.org/content/bug-report). We will then fix the bug and follow a process of responsible disclosure.

There are also unit and Selenium tests, which are found in the privly-application git submodule.

## Developer Documentation ##

Discussion of system concepts and high level processes are found in the [central wiki](https://github.com/privly/privly-organization/wiki). If you want to develop an injectable application, look in the `privly-applications` folder.

## Resources ##

[Foundation Home](http://www.privly.org)  
[Privly Project Repository List](https://github.com/privly)  
[Development Mailing List](http://groups.google.com/group/privly)  
[Testing Mailing List](http://groups.google.com/group/privly-test)  
[Announcement Mailing List](http://groups.google.com/group/privly-announce)  
[Central Wiki](https://github.com/privly/privly-organization/wiki)  
[Submit a Bug](http://www.privly.org/content/bug-report)  
[IRC](http://www.privly.org/content/irc)  
[Production Content Server](https://privlyalpha.org)  
[Development Content Server](https://dev.privly.org)  
[Download Extension](https://priv.ly/pages/download)

You can [install](https://chrome.google.com/webstore/detail/privly-content-extension/pkokikcdapfpkkkjpdaamjanniaempol) the latest release version of the extension from Google.

## Contacts ##

**Email**:  
Community [the 'at' sign] privly.org  

**Mail**:  
Privly  
PO Box 79  
Corvallis, OR 97339 
 
**IRC**:  
Contact the Nick "[smcgregor](https://github.com/smcgregor)" on irc.freenode.net #privly

**Bug**:  
If you open a bug on this repository, you'll get someone's attention

[ZeroBin]: https://github.com/privly/privly-organization/wiki/ZeroBin "ZeroBins"
[PlainPost]: https://github.com/privly/privly-organization/wiki/Posts "Plain Posts"
