// utils/update.js

/** 
 * 检查微信小程序是否为最新版本
 */
const checkUpdate = () => {
    // 检查当前微信版本是否兼容 updateManager API
    if (wx.canIUse('getUpdateManager')) {
        const updateManager = wx.getUpdateManager();

        // 检查小程序更新
        updateManager.onCheckForUpdate(res => {
            if (res.hasUpdate) {
                updateManager.onUpdateReady(() => {
                    wx.showModal({
                        title: '温馨提示',
                        content: '检测到有新版本，是否重启小程序？',
                        showCancel: false,
                        success: res => {
                            if (res.confirm) {
                                // 新版本已经下载好, 调用 applyUpdate 方法来应用新版本并重启
                                updateManager.applyUpdate()
                            }
                        }
                    });
                });
                updateManager.onUpdateFailed(() => {
                    // 新版本下载失败
                    wx.showModal({
                        title: '已有新版本',
                        content: '请您删除小程序，重新搜索进入。',
                    });
                });
            }
        })
    } else {
        wx.showModal({
            title: '温馨提示',
            content: '当前微信版本过低，无法使用该小程序，请升级到最新的微信版本后重试。'
        })
    }
};

module.exports = checkUpdate;
