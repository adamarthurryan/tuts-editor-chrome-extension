//only register listeners for the grapejs editor frame
if (window.frameElement && window.frameElement.classList.contains("gjs-frame")) {
  console.log("Injected script in gjs-frame");


  chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        console.log("Message received:", request);
        if (request.action === "alert") {
          alert(request.data);
          sendResponse();
        }
        
        if (request.action === "loghtml") {
          console.log(getEditorHtml());
          sendResponse();
        }

        if (request.action === "createanchors") {
          createAnchors();
          sendResponse();
        }
        if (request.action === "clearanchors") {
          clearAnchors();
          sendResponse();
        }

        if (request.action === "createoutline") {
          createOutline();
          sendResponse();
        }

        if (request.action === "fixtriplicateimages") {
          fixTriplicateImages();
          sendResponse();
        }

        return true;
      }
    );
}

//create a table of contents based on the current anchors in the editor
async function createOutline() {
  let editor = await getEditorHtml();
  let doc = editor.ownerDocument;

  let ul = doc.createElement("ul");

  let headers = Array.from(doc.querySelectorAll("h2, h3"));
  console.log(headers);
  headers.forEach(header => {
    console.log(header);
    let anchor = header.querySelector("a[name]");
    console.log(anchor);
    if (anchor) {
      let li = doc.createElement("li");
      let a = doc.createElement("a");
      a.setAttribute("href", "#"+anchor.getAttribute("name"));
      a.innerText = header.innerText;
      li.append(a);
      ul.append(li);
    }
    
  });

  console.log("outline:", ul.outerHTML);
  requestWriteHtmlToClipboard(ul.outerHTML);
}

//clear the anchors from the editor html
async function clearAnchors() {
  //get the doc
  let editor = await getEditorHtml();
  let doc = editor.ownerDocument;


  //select the h2 and h3 headers
  let headers = Array.from(editor.querySelectorAll("h2, h3"));
  headers.forEach(header=> {
    //find existing anchors and remove them
    let oldAnchors = Array.from(header.querySelectorAll("a[name]"));
    oldAnchors.forEach(oldAnchor => oldAnchor.remove());
  });

  //update the editor html
  //setEditorHtml(editor);

  requestWriteHtmlToClipboard(doc.querySelector("div").outerHTML);
}
//create anchors and update the editor html
async function createAnchors() {
  let editor = await getEditorHtml();
  let doc = editor.ownerDocument;

  let headers = Array.from(editor.querySelectorAll("h2, h3"));
  headers.forEach(header=> {
    //find existing anchors 
    let oldAnchors = Array.from(header.querySelectorAll("a[name]"));

    //only add a new anchor if there is no old one
    if (oldAnchors.length==0) {
      //create a new anchor
      const anchor = doc.createElement("a");
      anchor.setAttribute("name", header.innerText.toLowerCase().replace(/\s/g, "-").replace(/[^a-z0-9-]/g, ""));
      anchor.setAttribute("class", "mce-item-anchor");
      header.prepend(anchor);
    }
  });

  //update the editor html
  //setEditorHtml(doc);

  //requestWriteHtmlToClipboard(doc.querySelector("div").outerHTML);
}

const RE_IMG_URL = /https\:\/\/cms-assets.tutsplus.com\/cdn-cgi\/image\/width=\d+\/uploads\/(.*)/;

//fix any annoying triplicated images
async function fixTriplicateImages() {
  let editor = await getEditorHtml();
  let doc = editor.ownerDocument;

  // select all figures with exactly 3 img children
  let figures = Array.from(editor.querySelectorAll("figure"));
  figures = figures.filter(figure => Array.from(figure.querySelectorAll("img")).length == 3)

  //extract image url from first img
  figures.forEach(figure => {
    let imgUrl = figure.querySelector("img").src;
    let newUrl = imgUrl.replace(/https\:\/\/cms-assets.tutsplus.com\/cdn-cgi\/image\/width=\d+\/uploads\/(.*)/, "https://s3.amazonaws.com/cms-assets.tutsplus.com/uploads/$1");
  
    const img = doc.createElement("img");
    img.setAttribute("src", newUrl);
    img.setAttribute("loading", "lazy");

    //delete existing imgs
    figure.querySelectorAll("img").forEach(img => img.remove());
    //create new img and add to figure
    //if the figure has a link, add it to the link
    if (figure.querySelector("a"))
      figure.querySelector("a").appendChild(img);
    //otherwise just add it to the figure
    else
      figure.appendChild(img);
  })
}

//send a message to the background script
//TODO: this should be moved to a shared script
function sendMessageToBackground (message, callback=null) {
  console.log("sending message");

  chrome.runtime.sendMessage(message, callback);      
}

//needs to pass the html back to the popup to write to clipboard
async function requestWriteHtmlToClipboard(html) {
  sendMessageToBackground({action:"copyhtmltoclipboard", html});
}

//get html content of editor
//this runs in the context of the main frame of the page to interface with GrapeJS
async function getEditorHtml() {

  let editor = document.querySelector("div[data-gjs-type='wrapper']");
  console.log("getEditorHtml():", editor);
  return editor;  
}

//set html content of editor
//this runs in the context of the main frame of the page to interface with GrapeJS
async function setEditorHtml(doc) {
  //inject this code into the editor tab
  function injectableSetEditorHtml(doc) {
    let html = doc.firstChild.outerHTML;
    console.log(html);
    grapesjs.editors[0].setComponents(html);
  }

  //inject the script
  chrome.scripting.executeScript(
    {
      target: {tabId},
      func: injectableSetEditorHtml,
    },
    () => { console.log("setEditorHtml complete") }
  );

}

// parse html string and return a document or document fragment
function parseHtml(html) {
  var parser = new DOMParser();
  var htmlDoc = parser.parseFromString(html, 'text/html');
  
  return htmlDoc;
}



/* Untriplicate:

original figure
<figure class="post_image"><a href="https://codecanyon.net/category/mobile/android" target="_self"><img src="https://s3.amazonaws.com/cms-assets.tutsplus.com/uploads/users/769/posts/34427/image/codecanyon%20mobile%20android%20templates%20bestsellers.jpg" alt="CodeCanyon mobile Android app template bestsellers" loading="lazy" /></a></figure>

triplicated figure
<figure class="post_image"><a href="https://codecanyon.net/category/mobile/android" target="_self" data-mce-href="https://codecanyon.net/category/mobile/android">
<img class="resized-image resized-image-desktop" src="https://cms-assets.tutsplus.com/cdn-cgi/image/width=850/uploads/users/769/posts/34427/image/codecanyon%20mobile%20android%20templates%20bestsellers.jpg" alt="CodeCanyon mobile Android app template bestsellers" width="870px" height="649px" data-mce-src="https://cms-assets.tutsplus.com/cdn-cgi/image/width=850/uploads/users/769/posts/34427/image/codecanyon%20mobile%20android%20templates%20bestsellers.jpg" title="Image: https://cms-assets.tutsplus.com/cdn-cgi/image/width=850/uploads/users/769/posts/34427/image/codecanyon%20mobile%20android%20templates%20bestsellers.jpg"><img class="resized-image resized-image-tablet" src="https://cms-assets.tutsplus.com/cdn-cgi/image/width=630/uploads/users/769/posts/34427/image/codecanyon%20mobile%20android%20templates%20bestsellers.jpg" alt="CodeCanyon mobile Android app template bestsellers" width="650px" height="486px" data-mce-src="https://cms-assets.tutsplus.com/cdn-cgi/image/width=630/uploads/users/769/posts/34427/image/codecanyon%20mobile%20android%20templates%20bestsellers.jpg"><img class="resized-image resized-image-mobile" src="https://cms-assets.tutsplus.com/cdn-cgi/image/width=360/uploads/users/769/posts/34427/image/codecanyon%20mobile%20android%20templates%20bestsellers.jpg" alt="CodeCanyon mobile Android app template bestsellers" width="380px" height="286px" data-mce-src="https://cms-assets.tutsplus.com/cdn-cgi/image/width=360/uploads/users/769/posts/34427/image/codecanyon%20mobile%20android%20templates%20bestsellers.jpg"></a></figure>

detect

fix
  extract image url from first img
  rewrite  https://cms-assets.tutsplus.com/cdn-cgi/image/width=\d+/uploads/(.*) to https://s3.amazonaws.com/cms-assets.tutsplus.com/uploads/$1
  delete existing imgs
  create new img and add to figure

*/