//chrome.storage.sync.get("language", ({ language }) => {
//});

document.getElementById("button-createanchors").addEventListener('click', 
    () => sendMessageToActiveTab({action:"createanchors"})
);
document.getElementById("button-clearanchors").addEventListener('click', 
    () => sendMessageToActiveTab({action:"clearanchors"})
);
document.getElementById("button-createoutline").addEventListener('click', 
() => sendMessageToActiveTab({action:"createoutline"})
);
document.getElementById("button-fixtriplicateimages").addEventListener('click', 
() => sendMessageToActiveTab({action:"fixtriplicateimages"})
);

document.getElementById("button-copyposthtml").addEventListener('click', 
    () => sendMessageToBackground(
        {action:"getposthtml", url:"https://webdesign.tutsplus.com/tutorials/17-best-wordpress-gallery-plugins--cms-25961"},
        parseAndCopyPostHtml
    )
);

document.getElementById("button-alert").addEventListener('click', 
    () => sendMessageToActiveTab({action:"alert", data:"from popup"})
);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      bgLog("Message received (popup):"+ request);
      if (request.action === "copyhtmltoclipboard") {
        
        let html = request.html;
        writeTextToClipboard(html);
        sendResponse();
      }
    }
);  

//TODO: this should be moved to a shared script
//include the id of the active tab so it can be used in the content script
function sendMessageToActiveTab (message) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let tabIdPair = {tabId: tabs[0].id}
        let messageWithTabId = {... message, ...tabIdPair};
    
        chrome.tabs.sendMessage(tabs[0].id, messageWithTabId);
      });      
}
//TODO: this should be moved to a shared script
function sendMessageToBackground (message, callback=null) {
    chrome.runtime.sendMessage(message, callback);      
}

function parseAndCopyPostHtml(postHtml) {
    let postDoc = parseHtml(postHtml)
  
    let postBody = postDoc.getElementsByClassName('post-body__content')[0];
    
    writeHtmlToClipboard(postBody.innerHTML);
}

// parse html string and return a document or document fragment
function parseHtml(html) {
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(html, 'text/html');

    return htmlDoc;
}


async function writeTextToClipboard(text) {
    var type = "text/plain";
    var blob = new Blob([text], { type });
    var data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
}

//this function doesn't work
async function writeHtmlToClipboard(html) {
    var type = "text/html";
    var blob = new Blob([html], { type });
    var data = [new ClipboardItem({ [type]: blob })];
    await navigator.clipboard.write(data);
}

function bgLog(message) {
    sendMessageToBackground({action:"log", message});
}