importScripts('/js/jquery.js');
var db = openDatabase("bookmark", "1.0", "bookmark", 65536);
db_query("create table if not exists bookmark(id integer primary key autoincrement, name text, url text);");
db_query("create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);");
db_query("create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);");

function add_bookmark(info, tab) {
  db.transaction( 
    function(t) {
      t.executeSql("insert or ignore into bookmark(name, url) values(\"" + (tab["title"]) + "\", \"" + (tab["url"]) + "\");", []);
    });
}

chrome.contextMenus.create({"title": "Add to bookmark", "onclick": add_bookmark});
