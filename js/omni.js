chrome.runtime.onMessage.addListener(function(items, sender, sendRes) {
  console.log(items);
  var itemLen = items.length;
  if(itemLen === 1) {
    // マッチしたものが1つの場合は転送
    var url = items[0].url;
    var updateProp = { url: url };
    chrome.tabs.update(updateProp);
  } else {
    // html生成
    var html = "";
    for(var i = 0; i < itemLen; i++) {
      html += '<div class="col s6"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">' + items[i].name + '</span></div>';
      html += '<div class="card-action"><a href="' + items[i].url + '">開く</a></div></div></div>';
    }
    if(itemLen === 0) {
    // マッチしたものが0つの場合はnothing foundと表示
      html += '<div class="col s12"><div class="card blue-grey darken-1"><div class="card-content white-text"><span class="card-title">Nothing Found</span></div></div></div>';
    }
    // htmlを適応
    $result = $(document.documentElement).find("#result")
    $result.children().remove();
    $result.append(html);
  }
});
