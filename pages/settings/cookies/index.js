// pages/settings/cookies/index.js

Page({
  /** 页面的初始数据 */
  data: {
    xhsCookie: '', // 小红书 Cookie
    weiboCookie: '', // 微博 Cookie
    weiboCookiesPoolUrl: '' // 微博 Cookies 池的 URL
  },

  /** 处理页面加载事件 */
  onLoad() {
    const app = getApp();
    this.setData({
      xhsCookie: app.globalData.xhsCookie,
      weiboCookie: app.globalData.weiboCookie,
      weiboCookiesPoolUrl: app.globalData.weiboCookiesPoolUrl
    });
  },

  /** 设置小红书 Cookie */
  setXhsCookie(e) {
    this.setData({
      xhsCookie: e.detail.value
    });
    const app = getApp();
    app.setXhsCookie(this.data.xhsCookie);
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
  },

  /** 设置微博 Cookie */
  setWeiboCookie(e) {
    this.setData({
      weiboCookie: e.detail.value
    });
    const app = getApp();
    app.setWeiboCookie(this.data.weiboCookie);
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
  },

  /** 设置微博 Cookies 池的 URL */
  setWeiboCookiesPoolUrl(e) {
    this.setData({
      weiboCookiesPoolUrl: e.detail.value
    });
    const app = getApp();
    app.setWeiboCookiesPoolUrl(this.data.weiboCookiesPoolUrl);
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
  }
});