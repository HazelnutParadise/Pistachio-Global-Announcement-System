# 開心果網站全域廣播系統
利用 Cloudflare Workers 在網域下所有頁面插入橫幅，就算網站分別部署在不同伺服器也沒問題！

### 須設定的環境變數
|變數|值|說明|
|-|-|-|
|ACTIVE|true 或 false|是否插入橫幅|
|BANNER_BACKGROUND_COLOR|顏色色碼|橫幅的背景顏色|
|BANNER_TEXT|文字|橫幅的文字內容|
|BANNER_TEXT_COLOR|顏色色碼|橫幅中文字的顏色|
|LINK_TEXT|文字|接在 BANNER_TEXT 之後的超連結要顯示的文字|
|LINK_URL|網址|超連結要前往的網址|