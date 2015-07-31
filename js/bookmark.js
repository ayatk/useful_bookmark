/**
 * bookmark table:
 * [id, name, url]
 * tag table:
 * [id, bid, name]
 * memo table:
 * [id, bid, value]
 * bookmark.id --+-- tag.bid
 *               |
 *               +-- memo.bid
 * 
 * create table if not exists bookmark(id integer primary key autoincrement, name text, url text);
 * create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);
 * create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);
 * */
var modal = [];
var db = null;
var l;
var ret;
$(function() {
  db = openDatabase("bookmark", "1.0", "bookmark", 65536);
  db_query("create table if not exists bookmark(id integer primary key autoincrement, name text unique, url text unique);");
  db_query("create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);");
  db_query("create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);");

  $("#exec").click(function() {
    $("#f-search").submit();
  });

  $("#add").click(add_bookmark);

  $("#f-search").bind("submit keyup", search_bookmark);

  $("#opt_apply").click(function() {
    var id = $("#opt_apply").data("id");
    db_query('update bookmark ' + ' set name = "' + $("#opt_name").val() + '", url = "' + $("#opt_url").val() + '" where id = ' + id);
    db_query('delete from tag where bid = ' + id);
    var tags = $("#opt_tags").val().split(",");
    console.log(tags);
    for(var i = 0; i < tags.length; i++) {
      if (tags[i] == "") continue;
      db_query('insert into tag(bid, name) values(' + id + ', "' + tags[i] + '");');
    }
    get_tags(id);
    db_query("select * from bookmark where id = " + id).done(function(r) {
      modal_generate(r.rows.item(0));
    });

    $("#option_modal").closeModal();
  });

  $("#opt_cancel").click(function() {
    $("#option_modal").closeModal();
  });

  $("#opt_remove").click(function() {
    if(confirm("Are you sure?")) {
      db_query("delete from bookmark where id = " + id);
    }
    $("#option_modal").closeModal();
  });
});

function db_query(sql) {
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

function search_bookmark(event) {
    event.preventDefault();
    var text = $("#search").val();
    if (text === "") {
      return true;
    }

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

    $("#result").empty();

    db_query(sql).done(function(r) {
      var res = '<div class="col s12">' + r.rows.length + ' results</div>';
      var dd = "";
      for(var i = 0; i < r.rows.length; i++) {
        var item = r.rows.item(i);
        res += '<li class="black-text"><span class="col s8"><a href="' + item.url + '" target="_blank" class="tooltipped" data-position="right" data-tooltip="' + item.url + '">' + item.name + '</a></span><span class="col s4"><span class="badge tags" data-id="' + item.id + '"></span><a href="#" class="option-link" data-id="' + item.id + '">option</a></span></li><br>';
        get_tags(item.id);
      }
      $("#result").html(res);
      $("body").append(dd);
      $('.tooltipped').tooltip({delay: 10});
      $(".option-link").click(function() {
        var id = $(this).data("id");
        $("#opt_apply").data("id", id);
        db_query('select * from bookmark where id = ' + id).then(function(r) {
          $("#opt_url").val(r.rows.item(0).url);
          $("#opt_name").val(r.rows.item(0).name);

          return db_query('select id, bid, name from tag where bid = ' + id);
        }).done(function(r) {
          var tags_csv = "";
          for (var j = 0; j < r.rows.length; j++) {
            tags_csv += r.rows.item(j).name;
            if (j < r.rows.length - 1) {
              tags_csv += ",";
            }
          }
          $("#opt_tags").val(tags_csv);

          $("#option_modal").openModal();
        });
      });
    });
    return false;
}

function get_tags(id) {
  db_query('select * from tag where bid = ' + id).done(function(r2) {
    var res = "";
    var id;
    for(var j = 0; j < Math.min(2, r2.rows.length); j++) {
      var tags = r2.rows.item(j);
      res += tags.name;
      if (j + 1 < Math.min(2, r2.rows.length)) {
        res += ", ";
      }
      id = tags.bid;
    }
    if (r2.rows.length > 2) {
      res += "...";
    }
    $(".tags[data-id='" + id + "']").text(res);
  });
}

function add_bookmark() {
  if(confirm("Are you sure?")) {
    var tab = chrome.tabs.getSelected(null, function(tab) {
      db_query("insert or ignore into bookmark(name, url) values(\"" + (tab["title"]) + "\", \"" + (tab["url"]) + "\");");
    });
  }
}

