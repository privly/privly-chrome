Sending and Recieving Messages API
=======================================

Any injected application can send messages to the content script (privly.js) to trigger it to resize, show or hide the iframe content. JSON is used for this communication. Injected application can use the following blueprint for sending messages :-

An example of a message could be:
```
{command:"resize",
	frameID:"name of iframe"
	heightNEW:No. of pixels,
	}
```

**A possible syntax for sending this message over the host would be:**
```javascript
var message = {command:"resize",
	frameID:"name of iframe"
	heightNEW:No. of pixels
	};
 msgJSON = JSON.stringify(message);
 parent.postMessage(JSON.stringify(resizeData),"*");
 ```

##Possible set of options

* command 	: "resize" | "hide" | "show" 
* frameID  	: "<name of iframe>" 
* heightNEW	: no. of pixels


While using `hide` or `show` as the command, `heightNEW` doesn't matter and you may or may not include it in your message.

