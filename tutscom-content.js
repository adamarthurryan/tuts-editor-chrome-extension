console.log("Injected script");


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log("Message received:", request);
      if (request.action === "alert")
        alert(request.data);

      return true;
    }
  );

/* This approach is a bit flakey, better to just fetch the document from the background script.
//the post HTML will be stored here
let postHtml = "";

//schedule the getPostHTML() function to be called after the current call stack is exhausted
//if this script is specified in the manifest to run at document_start, then the original, unmodified HTML will be retreived
setTimeout(() => {
  postHtml = getPostHtml();
}, 0);


  
//get html content of post
function getPostHtml() {
  
  console.log(JSON.stringify(document));
  
  console.log(document.children[0].innerHTML);
  let postEl = document.getElementsByClassName('post-body__content')
  console.log(postEl);
  return postEl[0].innerHTML;
}

*/