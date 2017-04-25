# Useful Bookmark
Google Chromeのブックマーク検索機能があまりに貧弱だったので、データベース的に扱いたい・検索機能が欲しい・タグ付けしたいの気持ちで実装したGoogle Chrome Extensionです。

# 使い方
インストールするとページの左上にボタン、右クリックメニューに"Add to bookmark"メニューが出現します。左上のボタンを押すと検索窓が開き、ここでもブックマークの追加をすることができます。

# 検索クエリ
基本的にはタイトル検索です。
`-abcd`でabcdの否定をすることが出来ます。カッコには今のところ非対応です。
`A or B`, `A || B`で論理和検索、`A and B`, `A && B`で論理積検索ができます。
urlに含まれる文字列の場合は`url:example.com`を使うことが出来ます。
タグ検索の場合は`#tag`で検索できます。
タイトル・タグ・URL全てのうちどれかに合致する物を検索したい時は`all:`を使い、`all:slide`のように使います。

# オプション
検索結果の各エントリにはoptionというリンクが付いています。これをクリックするとオプションダイアログが開、名前/URL/タグの編集が可能です。また、REMOVEボタンを押すことで削除も可能です。

# オムニサーチ
アドレスバーに「ub&lt;tab&gt;」と打ち込むことでuseful bookmark内に存在するデータをアドレスバーから検索出来ます。使えるクエリーは全て上と同じです。

## License
The MIT License (MIT)

Copyright (c) 2017 Aya Tokikaze  
Copyright (c) 2015 Shiho Midorikawa
