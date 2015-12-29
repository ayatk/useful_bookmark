function generateSQL(text) {
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
      switch (m[0]) {
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
      switch (d[i + 1]) {
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
  for (var i = 0; i <= s; i++) {
    sql = "(" + sql;
  }
  sql = "select * from bookmark where " + sql;
  return sql;
}

