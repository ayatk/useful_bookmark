var db = openDatabase("bookmark", "1.0", "bookmark", 65536);
db_query("create table if not exists bookmark(id integer primary key autoincrement, name text, url text);");
db_query("create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);");
db_query("create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);");

function db_query(sql) {
  db.transaction(function(t) {t.executeSql(sql);});
}

function add_bookmark(info, tab) {
  db_query("insert or ignore into bookmark(name, url) values('" + (tab["title"]) + "', '" + (tab["url"]) + "');", []);
}

chrome.contextMenus.create({"title": "Add to bookmark", "onclick": add_bookmark});

//Omnibox
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
