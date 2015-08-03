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

chrome.runtime.onMessage.addListener(function(message, sender, sendRes) {
  //検索文構築
  var sql = "";
  var d = message.text.replace(/\s+/, " ").split(" ");
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

  //取得
  db_query_d(sql).done(function(res) {
    var rowLen = res.rows.length;
    if(rowLen === 1) {
      var url = res.rows[0].url;
      var updateProp = {
        url: url
      };
      chrome.tabs.update(updateProp)
    } else {
      //html生成
      var html = "";
      for(var i = 0; i < rowLen; i++) {
          html += '<div class="col s6"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">' + res.rows[i].name + '</span></div>';
          html += '<div class="card-action"><a href="' + res.rows[i].url + '">開く</a></div></div></div>';
      }
      if(rowLen === 0) {
          html += '<div class="col s12"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">Nothing Found</span></div></div></div>';
      }
      $(document.documentElement).find("#result").append(html);
    }
  });
});