chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    chrome.omnibox.setDefaultSuggestion({description: "UsefulBookmarkで検索: " + text});
});

chrome.omnibox.onInputEntered.addListener(
  function(text) {
    if(text !== "") {
      var url = chrome.extension.getURL("/view/omni.html");
      var createProp = {
        url: url
      };
      chrome.tabs.create(createProp, function(tab) {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
          if(tabId === tab.id) {
            chrome.tabs.sendMessage(tab.id, {text: text});
            text = "";
          }
        });
      });
    } else {
      var url = chrome.extension.getURL("/view/popup.html");
      var createProp = {
        url: url
      };
      chrome.tabs.create(createProp);
    }
});
