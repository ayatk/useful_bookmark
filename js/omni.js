var db = openDatabase("bookmark", "1.0", "bookmark", 65536);

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

chrome.runtime.onMessage.addListener(function(items, sender, sendRes) {
  console.log(items);
  var itemLen = items.length;
  if(itemLen === 1) {
    // マッチしたものが1つの場合は転送
    var url = items[0].url;
    var updateProp = { url: url };
    chrome.tabs.update(updateProp);
  } else {
    if(itemLen !== 0) {
      // tagを取得
      var sql = "select * from tag";
      db_query(sql).done(function(rset) {
        tagsSql = rset[0].rows;
        var tags = [];
        for(var i = 0; i < tagsSql.length; i++) {
          tags.push(tagsSql[i]);
        }
        // html生成
        var html = "";
        for(var i = 0; i < itemLen; i++) {
          // タグの文字列を生成
          var tag = tags.filter(function(itemIn) {
            return (itemIn.bid === items[i].id);
          });
          var tagLen = tag.length;
          var tagNames = "";
          if(tagLen > 0) {
            for(var i = 0; i < tagLen; i++) {
              tagNames += tag[i].name;
              if(i !== tagLen - 1) {
                tagNames += ", ";
              }
            }
          }
          html += '<div class="col s6"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">' + items[i].name + '</span>';
          if(tagNames !== "") {
            html += '<p>' + tagNames + '</p>';
          }
          html += '</div><div class="card-action"><a href="' + items[i].url + '">開く</a></div></div></div>';
          console.log(html);
        }
        // htmlを適応
        $(document.documentElement).find("#result").append(html);
      });
    } else {
      // マッチしたものが0つの場合はnothing foundと表示
      var html = '<div class="col s12"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">Nothing Found</span></div></div></div>';
      // htmlを適応
      $(document.documentElement).find("#result").append(html);
    }
  }
});
