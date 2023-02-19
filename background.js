
chrome.runtime.onInstalled.addListener(() => {
//  chrome.storage.sync.set({ language });
})

chrome.commands.onCommand.addListener((command) => {
  console.log(`Command: ${command}`);
//  if (command=='inject') {
//    injectScript();
//  }
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("Message received:", request);
    if (request.action === "getposthtml") {
      let html = getPostHtml(request.url);
      html.then(sendResponse);
      return true;
    }

    if (request.action === "clipboardtest") {
      console.log(testClipboard());
      sendResponse();
    }

    if (request.action === "log") {
      console.log(request.message);
      sendResponse();
    }

    if (request.action === "geteditorhtml") {

    }

    if (request.action === "seteditorhtml") {
      
    }
  }
);


async function getPostHtml(url) {
    
  let response = await fetch(url);
  //todo: error handling
  return response.text();
}

