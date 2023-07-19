// Electron 主进程 与 渲染进程 互相交互的桥梁
const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("config_view", {
    // 获取配置
    getConfig: () => ipcRenderer.invoke(
        "LiteLoader.config_view.getConfig"
    ),
    // 设置配置
    setConfig: config => ipcRenderer.invoke(
        "LiteLoader.config_view.setConfig",
        config
    ),
    // 显示目录选择框
    showPickDirDialog: () => ipcRenderer.invoke(
        "LiteLoader.config_view.showPickDirDialog"
    ),
    // 设置数据目录
    setProfilePath: path => ipcRenderer.invoke(
        "LiteLoader.config_view.setProfilePath",
        path
    ),
    // 打开目录
    openDirectory: path => ipcRenderer.invoke(
        "LiteLoader.config_view.openDirectory",
        path
    ),
    // 打开网址
    openURL: url => ipcRenderer.invoke(
        "LiteLoader.config_view.openURL",
        url
    ),
    // 退出软件
    quit: () => ipcRenderer.send(
        "LiteLoader.config_view.quit"
    )
});