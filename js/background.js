var db = openDatabase("bookmark", "1.0", "bookmark", 65536);
db_query("create table if not exists bookmark(id integer primary key autoincrement, name text, url text);");
db_query("create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);");
db_query("create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);");

function db_query(sql) {
  db.transaction(function(t) {t.executeSql(sql);});
}

function db_query_d(sql) {
  var dfd = jQuery.Deferred();
  db.transaction(
    function(t) {
      t.executeSql(sql,
        [],
        function(t, r) {
          dfd.resolve(r);
        }
      );
    }
  );
  return dfd.promise();
}

function add_bookmark(info, tab) {
  db_query("insert or ignore into bookmark(name, url) values('" + (tab["title"]) + "', '" + (tab["url"]) + "');", []);
}

chrome.contextMenus.create({"title": "Add to bookmark", "onclick": add_bookmark});

// Omnibox
chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    if(text !== "") {
      // 検索文構築
      var sql = "";
      var d = text.replace(/\s+/, " ").split(" ");
      var s = 0;

      for (var i = 0; i < d.length; i++) {
        if (d[i].startsWith("-")) {
          d[i] = d[i].substr(1);
          sql += "not ";
        }
        if (d[i].split(":").length != 1) {
          var m = d[i].split(":");
          switch(m[0]) {
            case "url":
              sql += 'url like "%' + m[1] + '%"';
              break;
            case "all":
              sql += '(url like "%' + m[1] + '%" or name like "%' + m[1] + '%" or id in (select bid from tag where name like "%' + m[1] + '%"))';
              break;
            default:
              sql += 'name like "%' + d[i] + '%"';
          }
        } else if (d[i][0] == "#") {
          var hash = d[i].substr(1);
          sql += 'id in (select bid from tag where name like "%' + hash + '%")';
        } else if (d[i] !== "") {
          sql += 'name like "%' + d[i] + '%"';
        }
        sql += ")";
        if (i + 1 < d.length) {
          switch(d[i + 1]) {
            case "and":
            case "&&":
              sql += " and ";
              i++;
              break;
            case "or":
            case "||":
              sql += " or ";
              i++;
              break;
           default:
              sql += " and ";
          }
          s++;
          continue;
        }
      }
      for(var i = 0; i <= s; i++) {
        sql = "(" + sql;
      }
      sql = "select * from bookmark where " + sql;

      db_query_d(sql).done(function(res) {
        var rowLen = res.rows.length;
        var suggests = [];
        if(rowLen > 5) {
          rowLen = 5; // 最大サジェスト表示数5
        }
        for(var i=0; i < rowLen; i++) {
          suggests.push({ content: res.rows[i].url, description: res.rows[i].name});
        }
        suggest(suggests);
      });
    }
    // デフォルトサジェスト
    chrome.omnibox.setDefaultSuggestion({description: "UsefulBookmarkで検索: " + text});
  }
);
chrome.omnibox.onInputEntered.addListener(
  function(text) {
    // サジェストをクリックした場合
    if(text.match(/^(?:https?|chrome):\/\/.*/)) {
      var url = text;
      var createProp = { url: url };
      chrome.tabs.create(createProp);
    // UsefulBookmarkで検索をクリックした場合(5つ以上知りたい場合など)
    } else if(text !== ""){
      var url = chrome.extension.getURL("/view/omni.html");
      var createProp = { url: url };
      chrome.tabs.create(createProp, function(tab) {
        chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
          if(tabId === tab.id) {
            chrome.tabs.sendMessage(tab.id, {text: text});
            text = "";
          }
        });
      });
    // その他
    } else {
      var url = chrome.extension.getURL("/view/popup.html");
      var createProp = { url: url };
      chrome.tabs.create(createProp);
    }
});
