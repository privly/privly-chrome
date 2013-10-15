This folder is for JavaScript libraries not developed exclusively for Privly, 
including the testing library Jasmine and the responsive CSS framework bootstrap.

The HTML sanitizer comes from [Google Caja](http://code.google.com/p/google-caja/wiki/JsHtmlSanitizer), but it is minified and difficult to audit. To build your own copy of Caja, follow these instructions:

1. Download the source code by checkout out the [SVN repository.](http://code.google.com/p/google-caja/source/checkout)
1. Build the library via [ant](http://code.google.com/p/google-caja/wiki/RunningCaja).
1. Look for the JS library in `google-caja-read-only/ant-lib/com/google/caja/plugin`

You can also swap in the non-minified version included in this directory.

