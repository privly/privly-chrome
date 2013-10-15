
This guide is intended to teach you the basics of developing a Privly injectable application.

# Quick Start #

If you are developing these applications, the easiest way to begin is to clone 
the [Google Chrome Extension](https://github.com/privly/privly-chrome) and hack 
on the privly-applications directory. That directory is the a copy of the 
privly-applications repository. You can also setup a development environment for 
the [Rails-based content server](https://github.com/privly/privly-chrome) if you 
like, but that is not the focus of this guide.

For basic experimentation, we recommend simply changing the code found in 
PlainPost for your needs. Please note that PlainPost is intentionally left simple 
to make hacking easier, but what functionality that is in place is critical to 
integrating with various platforms.

For more information on how injectable apps are structured, please read below.

# Directory Structure #

The applications are all in their own directory. The directory is determined by 
the name of the application, for instance, the PlainPost app is in the PlainPost 
directory. The required directory structure is:

    ApplicationName/
                    show.html
                    new.html
    shared/
           css/
               common.css
               tooltip.css
               injected/
                        injected.css
               top/
                   bootstrap-responsive.min.css
                   bootstrap.min.css
                   top.css
           images/
                  ajax-loader.gif
           javascripts/
                       parameters.js
                       host_page_integration.js
                       network_service.js
                       tooltip.js
                       meta_loader.js
           vendor/
                  html-sanitizer-minified.js
                  jquery.min.js
                  markdown.js
                  jasmine/
                  datatables-1.9.4/
                  bootstrap/
    
    

The pages may reference any contentApps must expose at least the following two 
pages within their application's directory:

* show: The application expects to be associated with pre-existing data found in 
the URL referencing it.
* new: The application is being used to generate a new URL that will likely be 
shared across the web.

Several JavaScripts are required to ease integration issues and are guaranteed to 
be present in the shared directory. Other scripts are optional and are provided 
to make certain tasks easier.

* `parameters.js`: Grabs the parameters found on both the query string and the 
anchor of the link.
* `host_page_integration.js`: (required) Interfaces the application with the host 
page. This is primarily used to resize the height of the application when it is 
viewed in the context of other web applications.
* `network_service.js`: Facilitates same-origin requests when served from an 
extension or application that permits it. This is generally not used when the 
application is hosted by the user's content server.
* `tooltip.js`: (required) Defines a tooltip that gives application metadata when 
it is injected into a host page. For the tooltip JavaScript to work, you must 
also include the `tooltip.css` in every injectable page. 
* `extension_integration.js`:  (required) Defines functions for integrating with 
extension platforms. This is primarily used for sending hyperlinks to extensions 
for their posting to host pages.
* `meta_loader.js`: "show.html" may be shown injected into a page, or as a normal 
top level web page. The meta loader checks for special meta tags defining CSS for 
specific contexts, which will be loaded dynamically. For more information, see 
the JavaScript file's source.
* `html-sanitizer-minified.js`: This is a library that ensures there are no 
script tags in content returned from remote servers. Use with care: HTML 
sanitization is a dangerous art and is prone to exploits.
* `jquery.min.js`: Jquery gives better cross-browser support for a number of 
operations. Try to live without it if you can, since it can create more overhead 
for your application than is necessary. If you don't know what jquery is, then 
you probably are going to have difficulty developing an application.
* `markdown.js`: Converts markdown text to HTML. This is primarily used for
previewing content typed in markdown.
* `jasmine/`: Jasmine is a JavaScript testing library. See 
[testing](https://github.com/privly/privly-organization/wiki/Testing).
* `datatables-1.9.4/`: Datatables provides a table view rendered in JavaScript
that is searchable.
* `bootstrap/`: Bootstrap provides mobile-responsive layout.

The shared CSS folder also has some recommended CSS for apps. The `top` and 
`injected` folders contain stylesheets which should only be applied when the page 
is viewed as the top application or an injected application, respectably.

# Connecting to Data Storage #

While the application can have a URL that points to a particular server, the 
application might not be served from the domain in the URL. Platforms serving the 
applications must allow the application to make appropriate same-origin requests. 
You can assume same-origin access for all "get" requests when creating a new 
link, but the way requests are handled when reading existing content is a bit 
more complicated.

* "Get" requests are universally permitted
* All other request types should make an effort to verify that the content 
server's data will not be mangled by interacting with you application. This can 
be most easily accomplished by storing a string in JSON data that specifies the 
list of supported applications.

You should use the `network_service.js` JavaScript library to make all requests 
to the remote server since it simplifies requests on several architectures.

Several of the cases are discussed below:

**"Hosted" Apps**

If a user does not have a local version of the application in a browser extension 
or on a mobile app, then they will click on the link and be taken to the 
content's storage provider. If the application does not support hosted operation 
(maybe it doesn't trust the server), then it should display an error message. 
Otherwise, the hosted content server should provide fallback operation, which is 
possible with clever use of cross-domain requests.

**Extension Apps**

Many platforms allow the developer to make same-origin requests to a content 
server. Your application should put in place proper precautions to prevent a URL 
attack. For instance, when an extension injects an application into the context 
of a social network, the URL may be tied to a server which does not expect your 
application's requests. This is a potentially potent attack similar to cross site 
scripting. You can mitigate it by requiring the content server to affirm its 
support for your injectable application in the initial get request. The best way 
to do this is to have data in the get request's response that affirms app 
support.

**Mobile Apps**

Mobile applications use an authentication token (essentially an API secret token) 
to gain access to the user's account. This is all handled by the 
`network_service.js` file without you needing to worry about it. Keep in find 
that if you need an authentication scheme, you will need to support the 
auth_token or implement the auth scheme inside the injectable application.

# Integration #

The applications must communicate with a variety of platforms and must support 
both posting new content (link creation) and reading existing content (injected 
into a host page and served from a content server).

## Posting a New Link ##

An application that is creating a new link should display the link in the UI when 
the posting process is complete, as well as fire the event found in 
[this specification](https://github.com/privly/privly-organization/wiki/Posting-Application). 
Firing the event will cause browser extensions to close the application and 
automatically paste the link into a host page.

Since the application may be served from a location other than the server hosting 
its data, extensions and mobile apps give the application a parameter specifying 
the target domain. This is all handled by `network_service.js` for you.

Make sure the html file is named "new.html." All other functionality for this 
posting application is up to the developer.

## Reading a Link Discovered on the Web ##

When viewing an existing application (ie after it has been posted to a host page 
like a webmail provider) then it could be viewed in several different contexts. 
We are making efforts to abstract away the differences in platforms using the 
shared JavaScript files, but you should take note of a few unique aspects of the 
different platforms.

Make sure the html file is named "show.html." All other functionality for this 
posting application is up to the developer.

### Injected Viewing ###

**Determining whether the App was Injected**

The injected view is triggered whenever the application sees that it is not the 
top window. This can be evaluated with this statement:

`window.self === window.top`

When this statement evaluates to true, then the current window (self) is the top 
window and it is not in an iframe. Conversely, if it evaluates to false, the 
application is being displayed in an iframe. There is a helper in 
`host_page_integration.js` that makes this easier.

**Setting the Height of the iframe**

The iframe is protected by what is known as the 
[same origin policy](http://en.wikipedia.org/wiki/Same_origin_policy). 
This means the host page only knows what your application tells it. Since the 
host page controls the height of your application, you must message it the height 
of the app. There are helpers for doing this in `host_page_integration.js`. Call 
either:

`privlyHostPage.dispatchResize(height)` to resize to a specified height, or

`privlyHostPage.resizeToWrapper()` to resize to the current height of the 
application. (note: for this function to work, you must have a div surrounding 
the content with the id `privlyHeightWrapper`, this allows JavaScript to get an 
accurate representation of the height of the content)

**Layout**

Now that you know your app is injected, you should take steps to ensure that the 
layout is non-intrusive to the host page in which it is contained. This currently 
means that you should not display much formatting, because there is no way to 
know what your surrounding context looks like.

### Top View ###

Either an extension or a hosted server could serve the application as the top 
window when reading the content. This is where you have full control of the 
application's environment, and need not worry about the strange integration cases 
outlined above.

# Platform Specific README #

Several platforms have their own readme with platform specific details. Make sure 
you check those out if you are developing on the corresponding platform.
