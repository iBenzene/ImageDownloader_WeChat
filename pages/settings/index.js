// pages/settings/index.js

Page({
  /** 页面的初始数据*/
  data: {
    detailsIconUrl: 'images/next.svg', // 详情图标的 URL
    defaultAvatarUrl: '', // 默认头像的 URL
    
    userInfo: null, // 用户个人信息
    token: '', // 用户 Token
  },

  /** 处理页面加载事件 */
  onLoad() {
    const app = getApp();
    this.setData({
      defaultAvatarUrl: app.globalData.defaultAvatarUrl,
      userInfo: app.globalData.userInfo,
      token: app.globalData.token
    });
  },

  /** 处理用户头像选择事件 */
  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail;

    this.setData({
      'userInfo.avatarUrl': avatarUrl
    });
    const app = getApp();
    app.setUserInfo(this.data.userInfo);

    if (!this.data.token) {
      this.login();
    }
  },

  /** 处理用户昵称输入事件 */
  onInputNickName(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    });
    const app = getApp();
    app.setUserInfo(this.data.userInfo);

    wx.request({
      url: 'https://api.ibenzene.top/update-nickname',
      method: 'POST',
      data: {
        nickName: this.data.userInfo.nickName
      },
      header: {
        Authorization: this.data.token,
      },
      success: res => {
        if (res.statusCode === 200) {
          wx.showToast({
            title: '昵称已保存',
            icon: 'success'
          });
        } else {
          console.error(`昵称修改失败: ${JSON.stringify(res)}`);
          wx.showToast({
            title: '昵称修改失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error(`昵称修改失败: ${err.errMsg}`);
        wx.showToast({
          title: '昵称修改失败',
          icon: 'none'
        });
      }
    });
  },

  /** 用户登录 */
  login() {
    wx.showLoading({
      title: '登录中'
    })
    const app = getApp();
    wx.login({
      success: res => {
        if (res.code) {
          if (app.globalData.isDebug) {
            console.log(`code: ${res.code}`);
          }
          wx.request({
            url: 'https://api.ibenzene.top/login',
            method: 'POST',
            data: {
              code: res.code,
              nickName: this.data.userInfo.nickName
            },
            success: res => {
              if (res.data.token) {
                if (app.globalData.isDebug) {
                  console.log(`token: ${res.data.token}`);
                }
                this.setData({
                  token: res.data.token
                });
                app.setToken(res.data.token);

                if (res.data.nickName) {
                  // 如果用户以前设置过昵称
                  this.setData({
                    'userInfo.nickName': res.data.nickName
                  });
                  app.setUserInfo(this.userInfo);
                }
                
                wx.hideLoading()
                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                });
              } else {
                console.error(`登录失败: ${res.data.message}`);
                wx.hideLoading()
                wx.showToast({
                  title: '登录失败',
                  icon: 'none'
                });
              }
            },
            fail: err => {
              console.error(`登录失败: ${err.errMsg}`);
              wx.hideLoading()
              wx.showToast({
                title: '登录失败',
                icon: 'none'
              });
            }
          })
        } else {
          console.error(`登录失败: ${JSON.stringify(res)}`);
          wx.hideLoading()
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          });
        }
      },
      fail: err => {
        console.error(`登录失败: ${err.errMsg}`);
        wx.hideLoading()
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  /** 退出登录 */
  logout() {
    this.setData({
      userInfo: {
        avatarUrl: this.data.defaultAvatarUrl,
        nickName: ''
      },
      token: ''
    });
    const app = getApp();
    app.setUserInfo(this.data.userInfo);
    app.setToken('');
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  }
})