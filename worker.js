addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

class HeadInjector {
  element(element) {
    // 插入样式和脚本，用于动态插入横幅并为横幅腾出空间
    const scriptHTML = `
      <style>
        #global-banner {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 45px !important;
          background: yellow !important;
          color: black !important;
          display: flex;
          text-align: center;
          align-items: center;
          justify-content: center;
          padding: 10px !important;
          z-index: 10000 !important;
        }
      </style>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          var banner = document.createElement('div');
          banner.id = 'global-banner';
          banner.innerHTML = '<strong>開心果全站廣播系統測試橫幅</strong>';
          document.body.appendChild(banner);

          // 动态调整页面内容上边距
          function adjustBodyMargin() {
            var bannerHeight = banner.offsetHeight;
            document.body.style.marginTop = bannerHeight + 'px';
          }

          // 在横幅插入之后立即调整一次
          adjustBodyMargin();

          // 监听窗口大小变化并重新调整
          window.addEventListener('resize', adjustBodyMargin);
        });
      </script>`
    // 在 <head> 结束标签之前插入脚本和样式
    element.append(scriptHTML, { html: true })
  }
}

async function handleRequest(request) {
  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return fetch(request)
  }

  // 直接转发请求给原始服务器
  const response = await fetch(request)

  // 检查响应的 Content-Type，确保只处理 HTML 响应
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('html')) {
    // 使用 HTMLRewriter 修改 HTML
    return new HTMLRewriter()
      .on('head', new HeadInjector())
      .transform(response)
  }

  // 对非 HTML 响应不做处理
  return response
}
