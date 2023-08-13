// 对比本地与远端的版本号，有新版就返回true
export function compareVersion(local_version, remote_version) {
    // 将字符串改为数组
    const local_version_arr = local_version.trim().split(".");
    const remote_version_arr = remote_version.trim().split(".");
    // 返回数组长度最大的
    const max_length = Math.max(local_version_arr.length, remote_version_arr.length);
    // 从头对比每一个
    for (let i = 0; i < max_length; i++) {
        // 将字符串改为数字
        const local_version_num = parseInt(local_version_arr?.[i] ?? "0");
        const remote_version_num = parseInt(remote_version_arr?.[i] ?? "0");
        // 版本号不相等
        if (local_version_num != remote_version_num) {
            // 有更新返回true，没更新返回false
            return local_version_num < remote_version_num;
        }
    }
    // 版本号相等，返回false
    return false;
}


// 获取配置文件
const config = await config_view.getConfig();


function initVersions(view) {
    const qqnt = view.querySelector(".versions .wrap.current .qqnt p");
    const liteloader = view.querySelector(".versions .wrap.current .liteloader p");
    const chromium = view.querySelector(".versions .wrap.current .chromium p");
    const electron = view.querySelector(".versions .wrap.current .electron p");
    const nodejs = view.querySelector(".versions .wrap.current .nodejs p");

    qqnt.textContent = LiteLoader.versions.qqnt;
    liteloader.textContent = LiteLoader.versions.liteLoader;
    chromium.textContent = LiteLoader.versions.chrome;
    electron.textContent = LiteLoader.versions.electron;
    nodejs.textContent = LiteLoader.versions.node;

    const title = view.querySelector(".versions .wrap.new h2");
    const update_btn = view.querySelector(".versions .wrap.new button");

    const jump_link = () => {
        config_view.openWeb(update_btn.value);
    }

    const try_again = () => {
        // 初始化 显示
        title.textContent = "正在瞅一眼 LiteLoaderQQNT 是否有新版本";
        update_btn.textContent = "你先别急";
        update_btn.value = null;
        update_btn.removeEventListener("click", jump_link);
        update_btn.removeEventListener("click", try_again);
        // 检测是否有新版
        const repo_url = LiteLoader.package.liteLoader.repository.url
        const release_latest_url = `${repo_url.slice(0, repo_url.lastIndexOf(".git"))}/releases/latest`;
        fetch(release_latest_url).then(res => {
            const new_version = (res.url).slice((res.url).lastIndexOf("/") + 1);
            // 有新版
            if (compareVersion(LiteLoader.versions.liteLoader, new_version)) {
                title.textContent = `发现 LiteLoaderQQNT 新版本 ${new_version}`;
                update_btn.textContent = "去瞅一眼";
                update_btn.value = res.url;
                update_btn.removeEventListener("click", try_again);
                update_btn.addEventListener("click", jump_link);
            }
            // 没新版
            else {
                title.textContent = "暂未发现 LiteLoaderQQNT 有新版本，目前已是最新";
                update_btn.textContent = "重新发现";
                update_btn.value = null;
                update_btn.removeEventListener("click", jump_link);
                update_btn.addEventListener("click", try_again);
            }
        });
    }

    try_again();
}


function initDataDir(view) {
    const modal_window = view.querySelector(".path .modal-window");
    const modal_dialog = view.querySelector(".path .modal-dialog");
    const first = modal_dialog.querySelector(".first");
    const second = modal_dialog.querySelector(".second");

    modal_window.addEventListener("click", event => {
        modal_window.classList.add("hidden");
    });

    modal_dialog.addEventListener("click", event => {
        event.stopPropagation();
    });

    const title = view.querySelector(".path h2");
    const path_input = view.querySelector(".path .path-input");
    const pick_dir = view.querySelector(".path .pick-dir");
    const open_dir = view.querySelector(".path .open-dir");
    const reset = view.querySelector(".path .reset");
    const apply = view.querySelector(".path .apply");

    path_input.value = LiteLoader.path.profile;

    pick_dir.addEventListener("click", async () => {
        const result = await config_view.showPickDirDialog();
        const path = result.filePaths?.[0];
        if (path) {
            path_input.value = path;
        }
    });

    open_dir.addEventListener("click", () => {
        config_view.showProfileDir();
    });

    reset.addEventListener("click", async () => {
        config_view.setProfilePath("").then(() => {
            path_input.value = LiteLoader.path.default_profile;
            first.classList.add("hidden");
            second.classList.remove("hidden");
            setTimeout(() => config_view.quit(), 2000);
        });
        modal_window.classList.remove("hidden");
    });

    apply.addEventListener("click", () => {
        config_view.setProfilePath(path_input.value).then(() => {
            first.classList.add("hidden");
            second.classList.remove("hidden");
            setTimeout(() => config_view.quit(), 2000);
        });
        modal_window.classList.remove("hidden");
    });

    // 非Windows平台禁止修改
    if (LiteLoader.os.platform != "win32") {
        path_input.readOnly = true;
        pick_dir.classList.add("disabled");
        reset.classList.add("disabled");
        apply.classList.add("disabled");
        title.textContent += "（非Windows平台请手动更改环境变量）"
    }
}


function initPluginList(view) {
    const parser = new DOMParser();
    const section_plugins = view.querySelector(".plugins");
    const plugin_lists = {
        extension: view.querySelector(".plugins .wrap.extension ul"),
        theme: view.querySelector(".plugins .wrap.theme ul"),
        framework: view.querySelector(".plugins .wrap.framework ul"),
        core: view.querySelector(".plugins .wrap.core ul")
    };

    section_plugins.addEventListener("click", event => {
        const target = event.target.closest(".title");
        if (target) {
            const icon = target.querySelector("svg");
            const list = target.nextElementSibling;
            icon.classList.toggle("is-fold");
            list.classList.toggle("hidden");
        }
    });

    for (const [slug, plugin] of Object.entries(LiteLoader.plugins)) {
        const hr = document.createElement("hr");
        hr.classList.add("horizontal-dividing-line");

        const plugin_item_html = `
        <li class="vertical-list-item">
            <div>
                <h2>${plugin.manifest.name}</h2>
                <span class="secondary-text">${plugin.manifest.description}</span>
            </div>
            <div class="q-switch is-active">
                <span class="q-switch__handle"></span>
            </div>
        </li>
        `;
        const doc = parser.parseFromString(plugin_item_html, "text/html");

        const plugin_item = doc.querySelector(".vertical-list-item");
        const q_switch = plugin_item.querySelector(".q-switch");

        q_switch.addEventListener("click", async () => {
            if (q_switch.classList.contains("is-active")) {
                config.disabled = [...config.disabled, slug];
            }
            else {
                config.disabled = config.disabled.filter(value => value != slug);
            }
            await config_view.setConfig(config);
            q_switch.classList.toggle("is-active");
        });

        if (config.disabled.includes(slug)) {
            q_switch.classList.remove("is-active");
        }

        const plugin_type = plugin.manifest.type;
        const plugin_list = plugin_lists[plugin_type] || plugin_lists.extension;

        plugin_list.appendChild(hr);
        plugin_list.appendChild(plugin_item);
    }
}


function initAbout(view) {
    const homepage_btn = view.querySelector(".about button.liteloaderqqnt");
    const github_btn = view.querySelector(".about button.github");
    const telegram_btn = view.querySelector(".about button.telegram");

    homepage_btn.addEventListener("click", event => config_view.openWeb(event.currentTarget.value));
    github_btn.addEventListener("click", event => config_view.openWeb(event.currentTarget.value));
    telegram_btn.addEventListener("click", event => config_view.openWeb(event.currentTarget.value));
}


export async function onConfigView(view) {
    const plugin_path = LiteLoader.plugins.config_view.path.plugin;
    const css_file_path = `llqqnt://local-file/${plugin_path}/src/style.css`;
    const html_file_path = `llqqnt://local-file/${plugin_path}/src/view.html`;

    // CSS
    const link_element = document.createElement("link");
    link_element.rel = "stylesheet";
    link_element.href = css_file_path;
    document.head.appendChild(link_element);

    // HTMl
    const html_text = await (await fetch(html_file_path)).text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html_text, "text/html");
    doc.querySelectorAll("section").forEach(node => view.appendChild(node));

    // 初始化
    initVersions(view);
    initDataDir(view);
    initPluginList(view);
    initAbout(view);
}