// pages/dev/dev.js
const download = require('../../utils/download.js');
const log = require('../../utils/log.js')

Page({
  /** 页面的初始数据 */
  data: {
    accentColor: null, // 主题色
    accentColorLight: null, // 主题色（浅）

    linkInput: '', // 用户输入的链接
    feedbackMessage: null, // 提示信息
    isError: false, // 错误标志
    selectedDownloader: '小红书图片下载器', // 默认选择的下载器类型
    downloaderTypes: ['小红书图片下载器', '小红书视频下载器', '米游社图片下载器', '微博图片下载器'] // 下载器类型列表
  },

  /** 处理页面加载事件 */
  onLoad() {
    const app = getApp();
    this.setData({
      accentColor: app.globalData.accentColor,
      accentColorLight: app.globalData.accentColorLight
    });
  },

  /** 处理输入框输入事件 */
  onInput(e) {
    this.setData({
      linkInput: e.detail.value
    });
  },

  /** 处理下拉菜单选择事件 */
  onPickerChange(e) {
    const selected = this.data.downloaderTypes[e.detail.value];
    this.setData({
      selectedDownloader: selected
    });
  },

  /** 处理粘贴按钮点击事件 */
  pasteButtonTapped() {
    wx.getClipboardData({
      success: res => {
        const clipboardContent = res.data;
        if (clipboardContent) {
          this.setData({
            linkInput: this.data.linkInput ? `${this.data.linkInput}\n${clipboardContent}` : clipboardContent
          });
        } else {
          this.setData({
            feedbackMessage: '剪贴板为空',
            isError: true
          });
        }
      }
    });
  },

  /** 处理下载按钮点击事件 */
  async downloadButtonTapped() {
    if (this.data.linkInput.trim() === '') {
      // 文本输入框为空
      this.setData({
        feedbackMessage: '请输入链接',
        isError: true
      });
      return;
    }

    const links = this.data.linkInput.split('\n');
    const urls = [];

    for (let index = 0; index < links.length; index++) {
      const link = links[index];
      const pattern = /http[s]?:\/\/[^\s，]+/;
      const match = link.match(pattern);
      if (match) {
        urls.push(match[0]);
      } else {
        wx.showToast({
          title: '链接无效',
          icon: 'none'
        });
        this.setData({
          feedbackMessage: `请检查第 ${index + 1} 行是否包含有效链接`,
          isError: true
        });
        return; // 只要有一个链接无效就拒绝下载
      }
    }

    if (urls.length === 0) {
      // 文本输入框内全为空行
      this.setData({
        feedbackMessage: '请输入链接',
        isError: true
      });
      return;
    }

    // 获取一些必要的全局变量
    const app = getApp();
    const token = app.globalData.token;
    const xhsCookie = app.globalData.xhsCookie;
    const weiboCookie = app.globalData.weiboCookie;
    const weiboCookiesPoolUrl = app.globalData.weiboCookiesPoolUrl;
    const logs = app.globalData.logs;
    const logDebugMsg = app.globalData.logDebugMsg;
    const isDebuggingBackend = app.globalData.isDebuggingBackend;

    // 由于微信小程序的一些限制, 部分下载器需要结合代理使用
    // 可惜, 目前支持的所有下载器都需要走代理（
    let useProxy = false;
    if (['小红书图片下载器', '小红书视频下载器', '米游社图片下载器', '微博图片下载器'].includes(this.data.selectedDownloader)) {
      useProxy = true;
      // 由于代理存在成本, 所以使用代理就必须登录
      if (!token) {
        wx.showToast({
          title: '未登录',
          icon: 'none'
        });
        this.setData({
          feedbackMessage: '请先登录',
          isError: true
        });
        return;
      }
    }

    // 同步地执行对于每一个有效链接的下载操作
    for (let [index, url] of urls.entries()) {
      wx.showLoading({
        title: '准备下载中'
      })

      try {
        await download(url, this.data.selectedDownloader, token, xhsCookie, weiboCookie, weiboCookiesPoolUrl, useProxy, logDebugMsg, isDebuggingBackend)

        wx.showToast({
          title: '下载成功',
          icon: 'success'
        });
        this.setData({
          feedbackMessage: `已保存到相册（${index + 1} / ${urls.length}）`,
          isError: false
        });
        // 添加一条日志记录
        logs.unshift({
          date: log.formatTime(new Date()),
          url
        });
        app.updateLogs(logs);
      } catch (err) {
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        });
        this.setData({
          feedbackMessage: `${err.message}（${index + 1} / ${urls.length}）`,
          isError: true
        });
      }
    }
  },

  /** 处理清空按钮点击事件 */
  clearButtonTapped() {
    this.setData({
      linkInput: '',
      feedbackMessage: null
    });
  }
});