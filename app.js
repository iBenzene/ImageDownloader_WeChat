// app.js

App({
  /** 全局变量 */
  globalData: {
    accentColor: '#eab33e', // 主题色
    accentColorLight: '#fdf4b3', // 主题色（浅）
    defaultAvatarUrl: 'images/avatar.svg', // 默认头像的 URL

    userInfo: null, // 用户个人信息
    token: '', // 用户 Token

    xhsCookie: '', // 小红书 Cookie
    weiboCookie: '', // 微博 Cookie
    weiboCookiesPoolUrl: '', // 微博 Cookies 池的 URL
    logs: [], // 下载日志

    isDebug: true // 是否要打印调试信息
  },

  /** 小程序初始化 */
  onLaunch() {
    this.globalData.token = wx.getStorageSync('token') || '';
    this.globalData.userInfo = wx.getStorageSync('userInfo') || {
      avatarUrl: this.globalData.defaultAvatarUrl,
      nickName: ''
    };

    this.globalData.weiboCookie = wx.getStorageSync('weiboCookie') || '';
    this.globalData.weiboCookiesPoolUrl = wx.getStorageSync('weiboCookiesPoolUrl') || '';
    this.globalData.logs = wx.getStorageSync('logs') || [];

    if (this.globalData.isDebug && this.globalData.token) {
      console.log(`token: ${this.globalData.token}`);
    }
  },

  /** 设置用户个人信息 */
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', this.globalData.userInfo);
  },

  /** 设置用户 Token */
  setToken(token) {
    this.globalData.token = token;
    wx.setStorageSync('token', this.globalData.token);
  },

  /** 设置小红书 Cookie */
  setXhsCookie(xhsCookie) {
    this.globalData.xhsCookie = xhsCookie;
    wx.setStorageSync('xhsCookie', this.globalData.xhsCookie);
  },

  /** 设置微博 Cookie */
  setWeiboCookie(weiboCookie) {
    this.globalData.weiboCookie = weiboCookie;
    wx.setStorageSync('weiboCookie', this.globalData.weiboCookie);
  },

  /** 设置微博 Cookies 池的 URL */
  setWeiboCookiesPoolUrl(weiboCookiesPoolUrl) {
    this.globalData.weiboCookiesPoolUrl = weiboCookiesPoolUrl;
    wx.setStorageSync('weiboCookiesPoolUrl', this.globalData.weiboCookiesPoolUrl);
  },

  /** 更新下载日志 */
  updateLogs(logs) {
    this.globalData.logs = logs;
    wx.setStorageSync('logs', this.globalData.logs);
  }
})