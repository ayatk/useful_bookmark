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
var dfds = [];
$(function() {
  db_query("create table if not exists bookmark(id integer primary key autoincrement, name text unique, url text unique);");
  db_query("create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);");
  db_query("create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);");

  $("#exec").click(function() {
    $("#f-search").submit();
  });

  $("#add").click(add_bookmark);

  $("#f-search").bind("submit keyup", function(e) {
    e.preventDefault();
    var text = $("#search").val();
    if (text === "") {
      return true;
    }
    search_bookmark(text);
  });

  $("#opt_apply").click(function() {
    var id = $("#opt_apply").data("id");
    db_query('update bookmark ' + ' set name = "' + $("#opt_name").val() + '", url = "' + $("#opt_url").val() + '" where id = ' + id);
    db_query('delete from tag where bid = ' + id);
    var tags = $("#opt_tags").val().split(",");
    for(var i = 0; i < tags.length; i++) {
      if (tags[i] == "") continue;
      db_query('insert into tag(bid, name) values(' + id + ', "' + tags[i] + '");');
    }
    get_tags(id);

    $("#option_modal").closeModal();
  });

  $("#opt_cancel").click(function() {
    $("#option_modal").closeModal();
  });

  $("#opt_remove").click(function() {
    if(confirm("Are you sure?")) {
      var id = $("#opt_apply").data("id");
      db_query("delete from bookmark where id = " + id);
    }
    $("#option_modal").closeModal();
  });

  db_query("select * from tag group by name").done(function(r) {
    r.forEach(function(item) {
      $("#tags-select").append($("<option>").val(item.name).text(item.name));
    });
  });
  $("#tags-select").change(function(event) {
    $("#search").val($("#search").val() + ($("#search").val().length<1?"":" ") + "#" + $(this).val());
    $(this).val(0);
    $("#f-search").keyup();
    return false;
  });
});

function db_query(sql) {
  var dfd = jQuery.Deferred();
  chrome.runtime.sendMessage({action:"sql", sql:sql}, function (r) {
    dfds[r.id] = dfd;
  });
  return dfd.promise();
}

function search_bookmark(text) {
    var sql = generateSQL(text);
    $("#result").empty();

    db_query(sql).done(function(r) {
      var res = '<li class="collection-header"><h6>' + r.length + ' results</h6></li>';
      r.forEach(function(item) {
        res += '<li class="black-text collection-item"><span class="title result-title"><a href="' + item.url + '" target="_blank" class="tooltipped" data-tooltip="' + item.url + '">' + item.name + '</a></span><a href="#" class="option-link secondary-content" data-id="' + item.id + '"><i class="material-icons">settings</i></a><p style="clear: both"><br><span class="badge tags" data-id="' + item.id + '"></span></p></li>';
        get_tags(item.id);
      });
      $("#result").html(res);
      $('.tooltipped').tooltip({delay: 10});
      $(".option-link").click(function() {
        var id = $(this).data("id");
        $("#opt_apply").data("id", id);
        db_query('select * from bookmark where id = ' + id).then(function(r) {
          $("#opt_url").val(r[0].url);
          $("#opt_name").val(r[0].name);

          return db_query('select id, bid, name from tag where bid = ' + id);
        }).done(function(r) {
          $("#opt_tags").val(r.map(function(d) {return d.name;}).join(","));

          $("#option_modal").openModal();
        });
      });
    });
    return false;
}


function get_tags(id) {
  db_query('select * from tag where bid = ' + id).done(function(r2) {
    $(".tags[data-id='" + id + "']").text(r2.map(function(d) {return d.name}).join(", "));
  });
}

function add_bookmark() {
  if(confirm("Are you sure?")) {
    var tab = chrome.tabs.getSelected(null, function(tab) {
      chrome.runtime.sendMessage({action:"add", title:tab["title"], url:tab["url"]});
    });
  }
}

chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
  switch(req.action) {
  case 'resolve':
    dfds[req.id].resolve(req.data);
    break;
  default:
    break;
  }
});
