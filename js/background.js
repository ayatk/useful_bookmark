db = openDatabase("bookmark", "1.0", "bookmark", 65536);
db_exec("create table if not exists bookmark(id integer primary key autoincrement, name text, url text);");
db_exec("create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);");
db_exec("create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);");
function db_query(callback, sql, data) {
  if (data == null) {
    data = []
  }
  db.transaction(
    function(t) {
      t.executeSql(sql,
        data,
        function(t, r) {
          callback(r);
        }
      );
    }
  );
}

function db_exec(sql) {
  db.transaction(
    function(t) {
      t.executeSql(sql);
    }
  );
}

function add_bookmark(info, tab) {
  var sql = "insert or ignore into bookmark(name, url) values(\"" + (tab["title"]) + "\", \"" + (tab["url"]) + "\");";
  db_exec(sql);
}

chrome.contextMenus.create({"title": "Add to bookmark", "onclick": add_bookmark});
