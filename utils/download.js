// utils/download.js

// 工具接口
/**
 * 下载指定链接内的图片或视频, 并保存至相册
 */
const download = async (url, selectedDownloader, token, xhsCookie, weiboCookie, weiboCookiesPoolUrl, useProxy, logDebugMsg, isDebuggingBackend) => {
  // 获取请求头和目标地址
  const headers = await getHeaders(selectedDownloader, token, xhsCookie, weiboCookie, weiboCookiesPoolUrl, isDebuggingBackend);
  const apiUrl = getApiUrl(url, selectedDownloader);
  if (logDebugMsg) {
    console.log(`headers: ${JSON.stringify(headers)}, apiUrl: ${apiUrl}`);
  }

  // 发起网络请求
  let text;
  try {
    let needRedirect = false;
    if (selectedDownloader === '小红书视频下载器' && apiUrl.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i)[1] === 'xhslink.com') {
      needRedirect = true;
    }
    text = await fetchUrl(apiUrl, token, headers, useProxy, needRedirect, isDebuggingBackend);
  } catch (err) {
    throw new Error(`网络请求失败: ${err.message}`);
  }

  // 解析响应的文本并从中提取图片或视频的链接
  const mediaUrls = parsingResponse(text, selectedDownloader, xhsCookie);
  if (mediaUrls.length === 0) {
    console.error(`请求 ${url} 的响应: ${text}`);
    throw new Error('响应的文本中不包含目标图片或视频的链接');
  }
  if (logDebugMsg) {
    console.log(`mediaUrls: ${mediaUrls.toString()}`);
  }

  // 根据提取的链接, 下载图片或视频, 并保存至相册
  for (let index = 0; index < mediaUrls.length; index++) {
    const mediaUrl = mediaUrls[index];
    wx.showLoading({
      title: `下载（${index + 1} / ${mediaUrls.length}）`
    });

    const filePath = `${wx.env.USER_DATA_PATH}/${new Date().valueOf()}.${selectedDownloader === '小红书视频下载器' ? 'mp4' : 'jpg'}`
    await new Promise((resolve, reject) => {
      wx.downloadFile({
        url: mediaUrl,
        filePath,
        success: res => {
          if (logDebugMsg) {
            console.log(`请求下载 ${mediaUrl} 的响应: ${JSON.stringify(res)}`);
          }
          if (res.statusCode === 200) {
            console.log(`✅ 资源 ${mediaUrl} 下载成功, 缓存路径为 ${filePath}`);
            resolve(res);
          } else {
            console.error(`资源 ${mediaUrl} 下载失败: ${res}`);
            reject(new Error('图片或视频下载失败'));
          }
        },
        fail: err => {
          reject(new Error(`图片或视频下载失败: ${err.errMsg}`));
        }
      });
    });
    if (selectedDownloader === '小红书视频下载器') {
      await saveVideoToPhotoLibrary(filePath);
    } else {
      await saveImageToPhotoLibrary(filePath);
    }
  }
}
module.exports = download;

// 辅助函数
/**
 * 发起网络请求, 获取包含目标资源 URL 的文本或对象
 */
const fetchUrl = async (url, token, headers, useProxy, needRedirect, isDebuggingBackend) => {
  const proxyUrl = isDebuggingBackend ? 'http://localhost:30081/v1/proxy' : 'https://api.ibenzene.top/image-downloader/v1/proxy';
  return new Promise((resolve, reject) => {
    if (useProxy) {
      wx.request({
        url: proxyUrl,
        method: 'POST', // 使用 POST 方法来传递实际请求的具体信息
        header: {
          Authorization: token // 访问代理 API 需要鉴权
        },
        data: {
          url, // 将实际请求的 URL 作为数据发送
          method: 'GET',
          parameters: headers, // 请求头的额外参数
          data: null,
          needRedirect // 是否需要重定向
        },
        success: res => {
          resolve(getResponse(res));
        },
        fail: reject
      });
    } else {
      wx.request({
        url: ensureHttps(url),
        header: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...headers // 拷贝其他头部
        },
        success: res => {
          resolve(getResponse(res));
        },
        fail: reject
      });
    }
  });
};

/** 
 * 获取网络请求的请求头（额外参数）
 */
const getHeaders = async (selectedDownloader, token, xhsCookie, weiboCookie, weiboCookiesPoolUrl, isDebuggingBackend) => {
  switch (selectedDownloader) {
    case '小红书视频下载器': {
      if (xhsCookie) {
        return {
          Cookie: xhsCookie
        };
      } else {
        // throw new Error('请配置 Cookies');
        return {};
      }
    }
    case '米游社图片下载器':
      return {
        'Referer': 'https://www.miyoushe.com/',
      };
    case '微博图片下载器': {
      // 优先使用 Cookies 池中的 Cookies
      if (weiboCookiesPoolUrl) {
        return new Promise((resolve, reject) => {
          wx.request({
            url: weiboCookiesPoolUrl,
            success: res => {
              // Cookies 池应该为 JSON 对象
              const contentType = res.header['Content-Type']
              if (contentType && contentType.indexOf('application/json') !== -1) {
                // 随机选择一个 Cookie
                const users = Object.keys(res.data);
                const randomUser = users[Math.floor(Math.random() * users.length)];
                resolve({
                  'Cookie': res.data[randomUser].cookie
                })
              } else {
                reject(new Error(`Cookies 池的格式不正确`));
              }
            },
            fail: err => {
              reject(new Error(`Cookies 池的 URL 无效: ${err.errMsg}`));
            }
          });
        });
      } else if (weiboCookie) {
        return {
          Cookie: weiboCookie
        };
      } else {
        // throw new Error('请配置 Cookies');
        // 请求生成一个游客 Cookie
        const proxyUrl = isDebuggingBackend ? 'http://localhost:30081/v1/proxy' : 'https://api.ibenzene.top/image-downloader/v1/proxy';
        return new Promise((resolve, reject) => {
          wx.request({
            url: proxyUrl,
            method: 'POST', // 使用 POST 方法来传递实际请求的具体信息
            header: {
              Authorization: token // 访问代理 API 需要鉴权
            },
            data: {
              url: 'https://passport.weibo.com/visitor/genvisitor2', // 将实际请求的 URL 作为数据发送
              method: 'POST',
              parameters: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }, // 请求头的额外参数
              data: 'cb=visitor_gray_callback&tid=&from=weibo', // 请求体的数据
              needRedirect: false
            },
            success: res => {
              console.log(`🍪 微博游客 Cookie: ${res.cookies}`);
              // 提取生成的游客 Cookie, 主要是 SUB 的值
              // let visitorCookie = '';
              // for (const cookieItem of res.cookies) {
              //   if (cookieItem.startsWith('SUB=')) {
              //     visitorCookie = cookieItem.split('SUB=')[1].split(';')[0];
              //     break;
              //   }
              // }
              resolve({
                // Cookie: visitorCookie
                Cookie: res.cookies
              });
            },
            fail: reject
          });
        });
      }
    }
    default: // 小红书图片下载器
      return {};
  }
};

/**
 * 获取网络请求的 API URL
 */
const getApiUrl = (url, selectedDownloader) => {
  switch (selectedDownloader) {
    case '米游社图片下载器': {
      const miyousheId = url.split('/').pop();
      return `https://bbs-api.miyoushe.com/post/wapi/getPostFull?gids=2&post_id=${miyousheId}&read=1`;
    }
    case '微博图片下载器': {
      const weiboId = url.split('/').pop().split('?')[0];
      return `https://weibo.com/ajax/statuses/show?id=${weiboId}&locale=zh-CN`;
    }
    default: // 小红书图片下载器、小红书视频下载器
      return url;
  }
};

/**
 * 获取网络请求响应的文本
 */
const getResponse = res => {
  let resData = res.data;

  // 如果响应的内容是 JSON 对象, 就转化为字符串
  // ToDo: 这种方式不是很优雅, 因为代码逻辑是从 iOS 端直接照搬过来的, 所以暂时先这样写, 有时间再进行适配和优化
  const contentType = res.header['Content-Type']
  if (contentType && contentType.indexOf('application/json') !== -1) {
    resData = JSON.stringify(res.data);
  }
  return resData;
}

/**
 * 解析响应的文本, 提取资源的 URL
 */
const parsingResponse = (text, selectedDownloader, xhsCookie) => {
  switch (selectedDownloader) {
    case '小红书图片下载器':
      return extractUrls(text, /<meta\s+name="og:image"\s+content="([^"]+)"/g);
    case '小红书视频下载器':
      if (xhsCookie) {
        return extractUrls(text, /"originVideoKey":"([^"]+)"/g, 'https://sns-video-al.xhscdn.com/');
      } else {
        return extractUrls(text, /<meta\s+name="og:video"\s+content="([^"]+)"/g);
      }
    case '米游社图片下载器':
      return extractUrls(text, /"images"\s*:\s*\[([^\]]+)\]/g, '', ',', true);
    case '微博图片下载器':
      return extractUrls(text, /"pic_ids"\s*:\s*\[([^\]]+)\]/g, 'https://wx1.sinaimg.cn/large/', ',', true);
    default:
      return [];
  }
};

/**  
 * 提取资源的 URL
 */
const extractUrls = (text, regex, prefix = '', delimiter = '', isJson = false) => {
  const urls = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (isJson) {
      const ids = match[1].replace(/"/g, '').split(delimiter);
      ids.forEach(id => urls.push(ensureHttps(prefix + id)));
    } else {
      const decodedUrl = (prefix + match[1]).replace(/\\u002F/g, '/');
      urls.push(ensureHttps(decodedUrl));
    }
  }
  return urls;
};

/**
 * 确保 URL 使用的是 HTTPS 协议
 */
const ensureHttps = url => {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

/**
 * 将图片保存至相册
 */
const saveImageToPhotoLibrary = async filePath => {
  await new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: res => {
        removeTempFile(filePath);
        resolve(res);
      },
      fail: err => {
        reject(new Error(`图片保存失败: ${err.errMsg}`));
      }
    });
  });
};

/**
 *  将视频保存至相册
 */
const saveVideoToPhotoLibrary = async filePath => {
  await new Promise((resolve, reject) => {
    wx.saveVideoToPhotosAlbum({
      filePath,
      success: res => {
        removeTempFile(filePath);
        resolve(res);
      },
      fail: err => {
        reject(new Error(`视频保存失败: ${err.errMsg}`));
      }
    });
  });
};

/** 
 * 删除临时文件
 */
const removeTempFile = filePath => {
  const fs = wx.getFileSystemManager();
  fs.unlink({
    filePath,
    success: _ => {
      console.log(`临时文件 ${filePath} 已删除`);
    },
    fail: err => {
      console.error(`临时文件 ${filePath} 删除失败: ${err.errMsg}`);
    }
  });
};