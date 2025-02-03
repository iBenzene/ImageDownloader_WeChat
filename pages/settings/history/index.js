// pages/settings/history/index.js

Page({
  /** 页面的初始数据 */
  data: {
    logs: [] // 下载日志
  },

  /** 处理页面加载事件 */
  onLoad() {
    const app = getApp();
    this.setData({
      logs: app.globalData.logs
    });
  },

  /** 处理历史记录点击事件 */
  historyTapped(e) {
    wx.setClipboardData({
      data: e._relatedInfo.anchorTargetText,
      success: _ => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
          duration: 1000
        });
      }
    });
  },

  /** 处理清空按钮点击事件 */
  clearButtonTapped() {
    this.setData({
      logs: []
    });
    const app = getApp();
    app.updateLogs(this.data.logs);
  }
});