import { escapeQuery, generateSQL } from "./common"

const db = openDatabase("bookmark", "1.0", "bookmark", 65536)
db_query(
  "create table if not exists bookmark(id integer primary key autoincrement, name text, url text);"
)
db_query(
  "create table if not exists tag     (id integer primary key autoincrement, bid integer, name text);"
)
db_query(
  "create table if not exists memo    (id integer primary key autoincrement, bid integer, value text);"
)
let id = 0

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

function add_bookmark(title, url) {
  db_query(
    "insert or ignore into bookmark(name, url) values('" +
      escapeQuery(title) +
      "', '" +
      url +
      "');",
    []
  )
}

function cb_add(info, tab) {
  add_bookmark(tab["title"], tab["url"])
}

chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
  switch (req.action) {
    case "sql":
      db_query(req.sql, id).done(function (r) {
        const rset = r[0]
        const response = []
        for (let i = 0; i < rset.rows.length; i++) {
          response.push(rset.rows.item(i))
        }
        chrome.runtime.sendMessage({
          action: "resolve",
          id: r[1],
          data: response,
        })
      })
      sendResponse({ id: id++ })
      break
    case "add":
      add_bookmark(req.title, req.url)
      break
    default:
      break
  }
  sendResponse("a")
})

chrome.contextMenus.create({ title: "Add to bookmark", onclick: cb_add })

let items = []
let sent = false
chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
  const sql = generateSQL(text)
  db_query(sql).done(function (rset) {
    rset = rset[0]
    console.log(rset)
    const response = []
    for (let i = 0; i < rset.rows.length; i++) {
      const item = rset.rows.item(i)
      response.push({
        content: "" + item.id,
        description:
          "<url>" + item.url + "</url> - <dim>" + item.name + "</dim>",
      })
      items.push(item)
    }
    suggest(response)
  })
})

chrome.omnibox.onInputEntered.addListener(function (text) {
  sent = false
  // サジェストをクリックした場合
  const textMatch = text.match(/\d+/)
  if (textMatch) {
    const item = items.filter(function (itemIn) {
      return itemIn.id === parseInt(textMatch[0])
    })[0]
    chrome.tabs.create({ url: item.url })
    // UsefulBookmarkで検索をクリックした場合(5つ以上知りたい場合など)
  } else if (text !== "") {
    const url = chrome.extension.getURL("/view/omni.html")
    chrome.tabs.create({ url: url }, function () {
      chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if (tabId === tab.id && !sent) {
          chrome.tabs.sendMessage(tab.id, items)
          sent = true
          items = []
        }
      })
    })
    // その他
  } else {
    const url = chrome.extension.getURL("/view/popup.html")
    chrome.tabs.create({ url: url })
  }
})
