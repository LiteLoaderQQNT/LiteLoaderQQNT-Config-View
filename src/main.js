// 运行在 Electron 主进程 下的插件入口
const { app, ipcMain, dialog } = require("electron");
const child_process = require("child_process");
const fs = require("fs");

// 默认配置
const default_config = {
    "disabled": []
};


function getConfig(liteloader) {
    const config_path = liteloader.path.config;
    try {
        const data = fs.readFileSync(config_path, "utf-8");
        const config = JSON.parse(data);
        return {
            ...default_config,
            ...{ "disabled": config?.disabled ?? [] }
        }
    }
    catch (error) {
        return default_config;
    }
}


function setConfig(liteloader, new_config) {
    const config_path = liteloader.path.config;
    try {
        const data = fs.readFileSync(config_path, "utf-8");
        const config = JSON.parse(data);

        config.disabled = new_config.disabled;

        const config_string = JSON.stringify(config, null, 4);
        fs.writeFileSync(config_path, config_string, "utf-8");
    }
    catch (error) {
        return error;
    }
}


function showPickDirDialog() {
    dialog.showOpenDialog({
        properties: [
            "openDirectory",
            "showHiddenFiles",
            "createDirectory"
        ]
    })
}


function setProfilePath(path) {
    return new Promise((resolve, reject) => {
        const command = `setx LITELOADERQQNT_PROFILE "${path}"`;
        child_process.exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout, stderr);
        });
    })
}

function openDirectory(path) {
    const command = `explorer "${path}"`;
    child_process.exec(command);
}

function openURL(url) {
    const command = `start "" "${url}"`;
    child_process.exec(command);
}


function quit() {
    app.quit();
}


function onLoad(plugin, liteloader) {
    // 获取配置
    ipcMain.handle(
        "LiteLoader.config_view.getConfig",
        (event, ...message) => getConfig(liteloader, ...message)
    );
    // 设置配置
    ipcMain.handle(
        "LiteLoader.config_view.setConfig",
        (event, ...message) => setConfig(liteloader, ...message)
    );
    // 显示目录选择框
    ipcMain.handle(
        "LiteLoader.config_view.showPickDirDialog",
        (event, ...message) => showPickDirDialog()
    );
    // 设置数据目录
    ipcMain.handle(
        "LiteLoader.config_view.setProfilePath",
        (event, ...message) => setProfilePath(...message)
    );
    // 打开目录
    ipcMain.handle(
        "LiteLoader.config_view.openDirectory",
        (event, ...message) => openDirectory(...message)
    );
    // 打开网址
    ipcMain.handle(
        "LiteLoader.config_view.openURL",
        (event, ...message) => openURL(...message)
    );
    // 退出软件
    ipcMain.on(
        "LiteLoader.config_view.quit",
        (event, ...message) => quit()
    );
}


module.exports = {
    onLoad
}