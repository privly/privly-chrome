# Injectable Application Development #

## Audience and Assumptions ##

You are interested in making a secure web application for use across the web.

* You have git
* You already know JavaScript and HTML
* You have the Chrome browser
* This guide is also available at https://github.com/privly/privly-chrome, named OSCON.md

## Steps ##

**Clone the Files**

The Chrome extension includes the most up to date injectable applications.  

Since you will be making changes to files that are packaged with an extension, you need to grab a development version of an extension. We are going to work with Chrome because it has the most advanced Privly Extension.

`git clone https://github.com/privly/privly-chrome.git`

**Load the Extension**

1. First you need to visit chrome://extensions in your Google Chrome.
1. Ensure that the Developer mode checkbox in the top right-hand corner is checked.
1. Click `Load unpacked extension` to pop up a file-selection dialog.
1. Navigate to the directory in which your extension files live, and select it.

**Get Your Development Account**

You don't need an account on our servers to hack on Privly, but it can make things easier. Visit `https://privlyalpha.org/users/invitation/new`. If you modify your email so that it is `username+oscon@domain.com`, where username is your email username and domain.com is your email domain, you should receive an invite. You will login with `username@domain.com` once you get the confirmation email.

The content server has serialized JSON storage, so you can use it with many different injectable apps without server-side changes.

**Start Hacking**

The PlainPost application in the privly-applications repository is the best place to start. It does not encrypt content and has tons of inline comments. Read the source!

## Contexts ##

Injectable applications usually handle several different contexts of operation. The most important for you to understand are `top` and `injected`. A top app has full control over the user experience and is not in the context of a potentially untrusted website. An injected app is viewed in the context of another web application and usually does not present any navigation or related structure.

A good place to hack on the injected context is the injected test case application:

`http://test.privly.org/test_pages/misdirection.html`

When these links inject, you will be viewing the PlainPost application served directly from the extension. Clicking on the content will open the top version of the application.

## Resources ##

* IRC (best place to go): #privly on irc.freenode.org
* Development Mailing List: groups.google.com/group/privly
* Wiki: https://github.com/privly/privly-organization/wiki