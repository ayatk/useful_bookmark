const db = openDatabase("bookmark", "1.0", "bookmark", 65536)

function db_query(sql, id) {
  const dfd = jQuery.Deferred()
  const sid = id
  db.transaction(function (t) {
    t.executeSql(sql, [], function (t, r) {
      dfd.resolve([r, sid])
    })
  })
  return dfd.promise()
}

chrome.runtime.onMessage.addListener(function (items) {
  console.log(items)
  const itemLen = items.length
  if (itemLen === 1) {
    // マッチしたものが1つの場合は転送
    const url = items[0].url
    const updateProp = { url: url }
    chrome.tabs.update(updateProp)
  } else {
    if (itemLen !== 0) {
      // tagを取得
      const sql = "select * from tag"
      db_query(sql).done(function (rset) {
        const tagsSql = rset[0].rows
        const tags = []
        for (let i = 0; i < tagsSql.length; i++) {
          tags.push(tagsSql[i])
        }
        // html生成
        let html = ""
        for (let i = 0; i < itemLen; i++) {
          // タグの文字列を生成
          const tag = tags.filter(function (itemIn) {
            return itemIn.bid === items[i].id
          })
          const tagLen = tag.length
          let tagNames = ""
          if (tagLen > 0) {
            for (let i = 0; i < tagLen; i++) {
              tagNames += tag[i].name
              if (i !== tagLen - 1) {
                tagNames += ", "
              }
            }
          }
          html +=
            '<div class="col s6"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">' +
            items[i].name +
            "</span>"
          if (tagNames !== "") {
            html += "<p>" + tagNames + "</p>"
          }
          html +=
            '</div><div class="card-action"><a href="' +
            items[i].url +
            '">開く</a></div></div></div>'
          console.log(html)
        }
        // htmlを適応
        $(document.documentElement).find("#result").append(html)
      })
    } else {
      // マッチしたものが0つの場合はnothing foundと表示
      const html =
        '<div class="col s12"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">Nothing Found</span></div></div></div>'
      // htmlを適応
      $(document.documentElement).find("#result").append(html)
    }
  }
})
