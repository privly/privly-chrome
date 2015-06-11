/*global chrome */
/*global Privly */
Privly.message.addListener(function (data) {
  if (typeof data.action !== 'string') {
    return;
  }

  if (data.action.indexOf('embeded/contentScript/') === 0) {

    // forward to content scripts
    Privly.message.messageContentScripts(data);

  } else if (data.action.indexOf('embeded/app/') === 0) {

    // forward to privly applications
    Privly.message.messagePrivlyApplications(data);

  } else if (data.action.indexOf('embeded/background/') === 0) {

    // should process by background script
    switch (data.action) {
    case 'embeded/background/popupLogin':
      chrome.windows.create({
        url: chrome.extension.getURL('privly-applications/Login/new.html?' + data.loginCallbackUrl),
        focused: true,
        top: 0,
        left: 0,
        type: 'normal'
      });

      break;
    }

  }

});
