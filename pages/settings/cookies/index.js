// pages/settings/cookies/index.js

Page({
    /** 页面的初始数据 */
    data: {
        xhsCookie: '', // 小红书 Cookie
    },

    /** 处理页面加载事件 */
    onLoad() {
        const app = getApp();
        this.setData({
            xhsCookie: app.globalData.xhsCookie
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
    }
});