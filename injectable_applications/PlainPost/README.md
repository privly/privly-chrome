This injectable application is provided as the most simplistic example of a Privly injectable application. It has only been tested with the [reference implementation content server](https://github.com/privly/privly-web), but it could easily be adapted for other web applications. If you want to adapt this injectable application for additional content servers, drop into irc: irc.freenode.net #privly, or [email the development mailing list](http://groups.google.com/group/privly). 

## Release Notes

The HTML sanitizer comes from [Google Caja](http://code.google.com/p/google-caja/wiki/JsHtmlSanitizer), but it is minified and difficult to audit. To build your own copy of Caja, follow these instructions:

1. Download the source code by checkout out the [SVN repository.](http://code.google.com/p/google-caja/source/checkout)
1. Build the library via [ant](http://code.google.com/p/google-caja/wiki/RunningCaja).
1. Look for the JS library in `google-caja-read-only/ant-lib/com/google/caja/plugin`

You can also swap in the non-minified version also included in this folder by editing `network_service.js`.
