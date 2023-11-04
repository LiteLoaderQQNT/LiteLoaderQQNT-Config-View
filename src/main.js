// 运行在 Electron 主进程 下的插件入口
const { app, ipcMain, dialog, shell } = require("electron");
const child_process = require("child_process");
const fs = require("fs");
const http = require("http");
const https = require("https");
const HttpsProxyAgent = require("https-proxy-agent");

// 默认配置
const default_config = {
    disabled: [],
    proxy: undefined
};

var proxyAgent = undefined;

// 简易的GET请求函数
function request(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        const req = protocol.get(url, { agent: proxyAgent });
        req.on("error", (error) => reject(error));
        req.on("response", (res) => {
            // 发生跳转就继续请求
            if (res.statusCode >= 300 && res.statusCode <= 399) {
                return resolve(request(res.headers.location));
            }
            const chunks = [];
            res.on("error", (error) => reject(error));
            res.on("data", (chunk) => chunks.push(chunk));
            res.on("end", () => {
                var data = Buffer.concat(chunks);
                resolve({
                    data: data,
                    str: data.toString("utf-8"),
                    url: res.url
                });
            });
        });
    });
}

function getConfig() {
    const config_path = LiteLoader.path.config;
    try {
        const data = fs.readFileSync(config_path, "utf-8");
        const config = JSON.parse(data);

        if (data?.proxy && data?.proxy != "") {
            proxyAgent = new HttpsProxyAgent.HttpsProxyAgent(data.proxy);
        } else {
            proxyAgent = undefined;
        }

        return {
            ...default_config,
            ...{ disabled: config?.disabled ?? [] },
            ...{ proxy: config?.proxy ?? undefined }
        };
    } catch (error) {
        return default_config;
    }
}

function setConfig(new_config) {
    const config_path = LiteLoader.path.config;
    try {
        const data = fs.readFileSync(config_path, "utf-8");
        const config = JSON.parse(data);

        config.disabled = new_config.disabled;
        config.proxy = new_config.proxy;

        if (new_config?.proxy && new_config?.proxy != "") {
            proxyAgent = new HttpsProxyAgent.HttpsProxyAgent(new_config.proxy);
        } else {
            proxyAgent = undefined;
        }

        const config_string = JSON.stringify(config, null, 4);
        fs.writeFileSync(config_path, config_string, "utf-8");
    } catch (error) {
        return error;
    }
}

function openWeb(url) {
    shell.openExternal(url);
}

function showPickDirDialog() {
    dialog.showOpenDialog({
        properties: ["openDirectory", "showHiddenFiles", "createDirectory"]
    });
}

function showProfileDir() {
    const profile_path = LiteLoader.path.profile;
    return shell.openPath(profile_path);
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
    });
}

function quit() {
    app.quit();
}

function onLoad(plugin) {
    getConfig(plugin);

    // 请求
    ipcMain.handle("LiteLoader.config_view.request", (event, url) =>
        request(url)
    );

    // 获取配置
    ipcMain.handle("LiteLoader.config_view.getConfig", (event, ...message) =>
        getConfig(...message)
    );
    // 设置配置
    ipcMain.handle("LiteLoader.config_view.setConfig", (event, ...message) =>
        setConfig(...message)
    );
    // 外部打开网址
    ipcMain.on("LiteLoader.config_view.openWeb", (event, ...message) =>
        openWeb(...message)
    );
    // 显示目录选择框
    ipcMain.handle(
        "LiteLoader.config_view.showPickDirDialog",
        (event, ...message) => showPickDirDialog()
    );
    // 显示数据目录
    ipcMain.handle(
        "LiteLoader.config_view.showProfileDir",
        (event, ...message) => showProfileDir()
    );
    // 设置数据目录
    ipcMain.handle(
        "LiteLoader.config_view.setProfilePath",
        (event, ...message) => setProfilePath(...message)
    );
    // 退出软件
    ipcMain.handle("LiteLoader.config_view.quit", (event, ...message) =>
        quit()
    );
}

module.exports = {
    onLoad
};
