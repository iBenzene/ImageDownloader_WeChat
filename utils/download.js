// utils/download.js

// 工具接口
/**
 * 下载指定链接内的图片或视频, 并保存至相册
 */
const download = async (url, selectedDownloader, token, logDebugMsg, isDebuggingBackend) => {
    // 解析响应的文本并从中提取图片或视频的链接
    const mediaUrls = await fetchMediaUrls(url, selectedDownloader, token, isDebuggingBackend);
    if (mediaUrls.length === 0) {
        console.error(`⚠️ 未提取到图片或视频的链接, 原始 URL: ${url}`);
        throw new Error('未提取到图片或视频的链接');
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
};

module.exports = download;

// 辅助函数
/**
 * 向后端发起提取图片或视频 URLs 的请求
 */
const fetchMediaUrls = async (url, downloader, token, isDebuggingBackend) => {
    const backendUrl = isDebuggingBackend ?
        'http://localhost:3000/v1/proxy/extract' :
        'https://api.wechat.image-downloader.ibenzene.cn/v1/proxy/extract';
    const requestUrl = `${backendUrl}?url=${encodeURIComponent(url)}&downloader=${encodeURIComponent(downloader)}`;
    console.log(`🔗 向 ${requestUrl} 发起解析请求`);

    return new Promise((resolve, reject) => {
        wx.request({
            url: requestUrl,
            method: 'GET',
            header: {
                Authorization: token
            },
            success: res => {
                if (res.statusCode === 200) {
                    resolve(res.data.mediaUrls);
                } else {
                    reject(new Error(`提取资源 URLs 失败: ${JSON.stringify(res.data)}`));
                }
            },
            fail: err => {
                reject(new Error(`提取资源 URLs 失败: ${err.errMsg}`));
            }
        });
    });
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