addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

class HeadInjector {
  element(element) {
    // 插入样式和脚本，用于动态插入横幅并为横幅腾出空间
    const styleHTML = `
      <style>
        #global-banner {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          background: ${BANNER_BACKGROUND_COLOR} !important;
          color: ${BANNER_TEXT_COLOR} !important;
          display: flex;
          font-size: 17px !important;
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
        #close-banner {
          position: absolute !important;
          right: 10px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          cursor: pointer !important;
        }
        #banner-content {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          width: 100% !important;
          padding-top: 0px !important;
          padding-bottom: 0px !important;
          padding-left: 10px !important;
          padding-right: 25px !important;
        }
        #banner-text {
          flex-grow: 1 !important;
          text-align: center !important;
        }
      </style>`;

    const scriptHTML = `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          if (window.self !== window.top) {
            // 如果在 iframe 中，不插入横幅
            return;
          }

          // 添加查询参数 banner=uuid
          if ('${ACTIVE}' === 'true') {
            const url = new URL(window.location.href);
            url.searchParams.set('banner', generateUUID());
            window.history.replaceState({}, '', url.toString());
          }

          var banner = document.createElement('div');
          banner.id = 'global-banner';
          banner.innerHTML = '<div id="banner-content"><span id="banner-text"><strong>${BANNER_TEXT}<a href="${LINK_URL}" target="_blank">${LINK_TEXT}</a></strong></span><span id="close-banner">✖</span></div>';
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

          // 关闭横幅
          document.getElementById('close-banner').addEventListener('click', function() {
            banner.style.display = 'none';
            document.body.style.marginTop = '0px';
          });
        });

        function generateUUID() {
          const timestamp = Date.now().toString(16);
          const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = (Math.random() * 16) | 0,
              v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
          return \`\${timestamp}-\${template}\`;
        }
      </script>`;

    // 在 <head> 结束标签之前插入样式和脚本
    element.append(styleHTML, { html: true });
    element.append(scriptHTML, { html: true });
  }
}

async function handleRequest(request) {
  // 只处理 GET 请求
  if (request.method !== 'GET') {
    return fetch(request);
  }

  // 检查 User-Agent 是否不为空，且不是 AJAX 请求
  const userAgent = request.headers.get('User-Agent') || '';
  const xRequestedWith = request.headers.get('X-Requested-With') || '';
  if (!userAgent || xRequestedWith === 'XMLHttpRequest') {
    return fetch(request);
  }

  // 修改 URL 以添加或移除查询参数 banner
  let url = new URL(request.url);
  if (ACTIVE === 'true') {
    url.searchParams.set('banner', generateUUID());
  } else if (url.searchParams.has('banner')) {
    url.searchParams.delete('banner');
    return Response.redirect(url.toString(), 301); // 重定向到移除 banner 参数的 URL
  }

  // 创建修改后的请求
  const modifiedRequest = new Request(url.toString(), request);
  let response = await fetch(modifiedRequest);

  // 检查响应的 Content-Type，确保只处理 HTML 响应
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('html')) {
    // 仅在 ACTIVE 为 'true' 时插入横幅并禁用缓存
    if (ACTIVE === 'true') {
      let modifiedResponse = new HTMLRewriter()
        .on('head', new HeadInjector())
        .transform(response);

      let newResponse = new Response(modifiedResponse.body, modifiedResponse);
      newResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      newResponse.headers.set('Pragma', 'no-cache');
      newResponse.headers.set('Expires', '0');
      newResponse.headers.set('Surrogate-Control', 'no-store');

      return newResponse;
    } else {
      // 对于 ACTIVE 不为 'true' 的情况，禁用浏览器缓存，但允许 Cloudflare 缓存
      let newResponse = new Response(response.body, response);
      newResponse.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
      newResponse.headers.set('Pragma', 'no-cache');
      newResponse.headers.set('Expires', '0');
      return newResponse;
    }
  }

  // 对非 HTML 响应不做处理
  return response;
}

// 生成包含当前时间的 UUID
function generateUUID() {
  const timestamp = Date.now().toString(16);
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return `${timestamp}-${template}`;
}
