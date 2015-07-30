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
  db_exec("create table if not exists bookmark(id integer primary key autoincrement, name text unique, url text unique);");
  db_exec("create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);");
  db_exec("create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);");
  $("#exec").click(function() {
    $("#f-search").submit();
  });
  $("#add").click(add_bookmark);
  $("#f-search").bind("submit keyup", function(event) {
    event.preventDefault();
    var text = $("#search").val();
    if (text === "") {
      return true;
    }
    var sql = "select * from bookmark where ";
    var d = text.replace(/\s+/, " ").split(" ");
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
          break;
        default:
          sql += " and ";
        }
        continue;
      }
    }
    console.log(sql);
    $("#result").empty();
    db_query(sql).done(function(r) {
      var res = '<div class="col s12">' + r.rows.length + ' result</div>';
      var dd = "";
      for(var i = 0; i < r.rows.length; i++) {
        var item = r.rows.item(i);
        res += '<li class="black-text" id="b-' + item.id + '"><span class="col s8"><a href="' + item.url + '" target="_blank" class="tooltipped" data-position="right" data-tooltip="' + item.url + '">' + item.name + '</a></span><span class="col s4">';
        res += '<span class="badge" id="tags-' + item.id + '"></span>';
        res += '<a id="opt-' + item.id + '">option</a></span></li><br>';
        $("#opt-" + item.id).unbind("click");
        get_tags(item.id);
      }
      $("#result").html(res);
      $("body").append(dd);
      $('.tooltipped').tooltip({delay: 10});
      for (var i = 0; i < r.rows.length; i++) {
        var item = r.rows.item(i);
        modal_generate(item);
      }
      });
    return false;
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

function db_exec(sql) {
  db.transaction(
    function(t) {
      t.executeSql(sql);
    }
  );
}

function modal_generate(item) {
  db_query('select id, bid, name from tag where bid = ' + item.id/* + ' union select ' + item.id + ', "' + item.name + '","' + item.url + '"'*/).done(function(r2) {
    var id = item.id;//r2.rows.item(0).id;
    var name = item.name;//r2.rows.item(0).bid;
    var url = item.url;//r2.rows.item(0).name;
    modal[id] = '<div class="modal-content row flow-text"><h4>Option</h4><div>';
    modal[id] += '<div><div class="col s4">Name:</div><input class="col s8" id="name" value="' + name + '"></div><br>';
    modal[id] += '<div><div class="col s4">URL:</div><input class="col s8" id="url" value="' + url + '"></div><br>';
    modal[id] += '<div><div class="col s4">Tags:</div>';
    var tags_csv = "";
    for (var j = 0; j < r2.rows.length; j++) {
      var tag = r2.rows.item(j);
      tags_csv += tag.name;
      if (j + 1 < r2.rows.length) {
        tags_csv += ",";
      }
    }
    modal[id] += '<input class="col s8" id="tags" value="' + tags_csv + '"></div><br>';
    modal[id] += '</div><div class="offset-s8 s4">';
    modal[id] += '<a class="btn" id="opt_apply_' + id + '">OK</a> ';
    modal[id] += '<a class="btn" id="opt_cancel_' + id + '">Cancel</a> ';
    modal[id] += '<a class="btn" id="opt_remove_' + id + '">Remove</a> ';
    modal[id] += '</div>';
    $("#option_modal").html(modal[id]);
    $("#opt-" + id).click(function() {
      var id = this.id.split("-")[1];
      $("#option_modal").html(modal[id]);
      $("#opt_apply_" + id).click(function() {
        sql = 'update bookmark ' + ' set name = "' + $("#name").val() + '", url = "' + $("#url").val() + '" where id = ' + id;
        db_exec(sql);
        db_exec('delete from tag where bid = ' + id);
        var tags = $("#tags").val().split(",");
        console.log(tags);
        for(var i = 0; i < tags.length; i++) {
          db_exec('insert into tag(bid, name) values(' + id + ', "' + tags[i] + '");');
        }
        get_tags(id);
        db_query("select * from bookmark where id = " + id).done(function(r) {
          modal_generate(r.rows.item(0));
        });

        $("#option_modal").closeModal();
      });
      $("#opt_cancel_" + id).click(function() {
        $("#option_modal").closeModal();
      });
      $("#opt_remove_" + id).click(function() {
        if(confirm("Are you sure?")) {
          db_exec("delete from bookmark where id = " + id);
        }
        $("#option_modal").closeModal();
      });
      $("#option_modal").openModal();
    });
  });
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
    $("#tags-" + id).text(res);
  });
}

function add_bookmark() {
  if(confirm("Are you sure?")) {
    var tab = chrome.tabs.getSelected(null, function(tab) {
      db_exec("insert or ignore into bookmark(name, url) values(\"" + (tab["title"]) + "\", \"" + (tab["url"]) + "\");");
    });
  }
}

