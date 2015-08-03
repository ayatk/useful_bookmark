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

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
	if(text === "") {
	  var suggestions = [
        {content: "popup.html", description: "UsefulBookmarkで検索"}
      ];
    } else {
      var suggestions = [
        {content: text, description: "UsefulBookmarkで検索: " + text}
      ];
    }
    suggest(suggestions);
});

chrome.omnibox.onInputEntered.addListener(
  function(text) {
    if(text !== "") {
      //検索文構築
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
      //取得
      db_query_d(sql).done(function(res) {
        if(res.rows.length === 1) {
          var win = window.open(res.rows[0].url);
        } else {
          //html生成
          var html = '<html><head><title>Usefull Bookmark</title>' +
                     '<link rel="stylesheet" href="../css/materialize.min.css"><link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"><link rel="stylesheet" href="../css/omni.css"><script type="text/javascript" src="../js/jquery.js"></script><script type="text/javascript" src="../js/materialize.min.js"></script>' +
                     '</head><body class="row">' +
                     '<div><h1 class="center-align col s12">Result</h1><hr style="margin-top: 20px;">' +
                     '<div id="result">'
          for(var i = 0; i < res.rows.length; i++) {
            html += '<div class="col s6"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">' + res.rows[i].name + '</span></div>'
            html += '<div class="card-action"><a href="' + res.rows[i].url + '">開く</a></div></div></div>'
          }
          if(res.rows.length === 0) {
            html += '<div class="col s12"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">Nothing Found</span></div></div></div>'
          }
          html += '</div></div></body></html>'
          var win = window.open();
          win.document.open();
          win.document.write(html);
          win.document.close();
        }
      });
    } else {
      var html = '<html><head><link rel="stylesheet" href="../css/blank.css"><title>Usefull Bookmark</title></head>' +
                 '<body><iframe seamless sandbox="allow-same-origin allow-forms allow-scripts" src="../view/popup.html"></iframe></body></html>';
      var win = window.open();
      win.document.open();
      win.document.write(html);
      win.document.close();
    }
});
