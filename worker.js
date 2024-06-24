addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

class HeadInjector {
  element(element) {
    // 插入樣式和腳本，用於動態插入橫幅並為橫幅騰出空間
    const styleHTML = `
      <style>
        #global-banner {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          background: yellow !important;
          color: black !important;
          display: flex;
          text-align: center;
          align-items: center;
          justify-content: center;
          padding: 10px !important;
          z-index: 10000 !important;
          box-sizing: border-box !important;
        }
        #global-banner a {
          color: blue !important;
          text-decoration: underline !important;
        }
        #global-banner a:hover {
          color: DeepSkyBlue !important;
        }
      </style>`;

    const scriptHTML = `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          var banner = document.createElement('div');
          banner.id = 'global-banner';
          banner.innerHTML = bannerContent;
          document.body.appendChild(banner);

          // 動態調整頁面內容上邊距
          function adjustBodyMargin() {
            var bannerHeight = banner.offsetHeight;
            document.body.style.marginTop = bannerHeight + 'px';
          }

          // 在橫幅插入之後立即調整一次
          adjustBodyMargin();

          // 監聽窗口大小變化並重新調整
          window.addEventListener('resize', adjustBodyMargin);
        });
      </script>
      <script>
        const bannerContent = '<strong>${BANNER_TEXT}<a href="${LINK_URL}" target="_blank">${LINK_TEXT}</a></strong>';
      </script>`;

    // 在 <head> 結束標籤之前插入樣式和腳本
    element.append(styleHTML, { html: true });
    element.append(scriptHTML, { html: true });
  }
}

async function handleRequest(request) {
  // 只處理 GET 請求
  if (request.method !== 'GET') {
    return fetch(request);
  }

  // 直接轉發請求給原始伺服器
  const response = await fetch(request);

  // 檢查回應的 Content-Type，確保只處理 HTML 回應
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('html')) {
    // 使用 HTMLRewriter 修改 HTML
    return new HTMLRewriter()
      .on('head', new HeadInjector())
      .transform(response);
  }

  // 對非 HTML 回應不做處理
  return response;
}
