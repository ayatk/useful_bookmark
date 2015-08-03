var db = openDatabase("bookmark", "1.0", "bookmark", 65536);
db_query("create table if not exists bookmark(id integer primary key autoincrement, name text, url text);");
db_query("create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);");
db_query("create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);");
var id = 0;

function db_query(sql, id) {
  var dfd = jQuery.Deferred();
  var sid = id;
  db.transaction(
    function(t) {
      t.executeSql(sql,
        [],
        function(t, r) {
          dfd.resolve([r, sid]);
        }
      );
    }
  );
  return dfd.promise();
}

function add_bookmark(title, url) {
  db_query("insert or ignore into bookmark(name, url) values('" + title + "', '" + url + "');", []);
}

function del_bookmark(id) {
  db_query("delete from bookmark where id = " + id);
}

function cb_add(info, tab) {
  add_bookmark(tab["title"], tab["url"]);
}

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    switch(req.action) {
    case 'sql':
      db_query(req.sql, id).done(function(r) {
        var rset = r[0];
        var response = [];
        for (var i = 0; i < rset.rows.length; i++) {
          response.push(rset.rows.item(i));
        }
        chrome.runtime.sendMessage({action:"resolve", id:r[1], data:response});
      });
      sendResponse({id: id++});
      break;
    case 'add':
      add_bookmark(req.title, req.url);
      break;
    default:
      break;
    }
    sendResponse("a");
});
chrome.contextMenus.create({"title": "Add to bookmark", "onclick": cb_add});
