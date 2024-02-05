import {
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
} from "obsidian";
import { ulid } from "ulid";

interface uuidPluginSettings {
    uuidKey: string;
    blacklist: string[];
    whitelist: string[];
    uuidStyle: number;
}

const DEFAULT_SETTINGS: uuidPluginSettings = {
    uuidKey: "uuid",
    blacklist: [],
    whitelist: [],
    uuidStyle: 1,
};

let expSettings: uuidPluginSettings;
function getSettings(app: App) {
    return expSettings;
}
function addID(app: App): (f: TFile) => Promise<void> {
    return async function (f: TFile): Promise<void> {
        const key = getSettings(app).uuidKey;
        if (!app.metadataCache.getFileCache(f)?.frontmatter?.[key]) {
            var uuid = "";
            if (getSettings(app).uuidStyle === 1) {
                uuid = ulid();
            } else {
                const ctime = new Date(f.stat.ctime); // 将时间戳数字转换为 Date 对象
                const formattedTime = formatDate(ctime); // 格式化时间 yyyyMMdd_hhmmss
                uuid = formattedTime;
            }
            await app.fileManager.processFrontMatter(f, (data) => {
                data[key] = uuid;
            });
        } else {
            new Notice(`${f.path} 中 uuid 已经存在`, 2000);
        }
    };
}

//时间戳格式化，应该可以引第三方库date-fns，先暂时自己写函数吧
function formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

function addIDsToAllNotesBesidesBlacklist(app: App) {
    const _addID = addID(this.app);
    return function () {
        const blacklist = getSettings(this.app).blacklist;

        if (blacklist.length === 0) {
            app.vault.getMarkdownFiles().forEach((f) => _addID(f));
            return; // 如果blacklist为空，不需要过滤任何文件，直接给所有文件添加uuid
        } else {
            const targetfiles = app.vault
                .getMarkdownFiles()
                .filter(
                    (t) => !blacklist.some((folder) => t.path.includes(folder))
                );
            new Notice(`正在给${targetfiles.length}个笔记添加uuid，但是`, 0);
            targetfiles.forEach((f) => _addID(f));
        }
    };
}

function addIDsToWhitelist(app: App) {
    const _addID = addID(this.app);
    return function () {
        const whitelist = getSettings(this.app).whitelist;

        if (whitelist.length === 0) {
            return; // 如果whitelist为空，不需要给任何文件添加uuid
        } else {
            const targetfiles = app.vault
                .getMarkdownFiles()
                .filter((t) =>
                    whitelist.some((folder) => t.path.includes(folder))
                );
            new Notice(`正在给${targetfiles.length}个笔记添加uuid，但是`, 0);
            targetfiles.forEach((f) => _addID(f));
        }
    };
}

function addIDsToCurrentNotes(app: App) {
    const _addID = addID(this.app);
    return function () {
        const currentFile = app.workspace.getActiveFile();
        if (!currentFile) {
            return;
        }
        if (currentFile.extension != "md") {
            new Notice("当前文件不是md笔记", 1000);
            return;
        }
        _addID(currentFile);
    };
}
export default class uuidPlugin extends Plugin {
    settings: uuidPluginSettings;
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new uuidSettingTab(this.app, this));

        this.addCommand({
            id: "add-ids-to-all-notes-besides-blacklist",
            name: "Add an UUID to all notes besides blacklist",
            callback: addIDsToAllNotesBesidesBlacklist(this.app),
        });

        this.addCommand({
            id: "add-id-to-current-note",
            name: "Add an UUID to current note",
            callback: addIDsToCurrentNotes(this.app),
        });

        this.addCommand({
            id: "add-ids-to-whitelist-notes",
            name: "Add an UUID to whitelist notes",
            callback: addIDsToWhitelist(this.app),
        });
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
        expSettings = this.settings;
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
class uuidSettingTab extends PluginSettingTab {
    plugin: uuidPlugin;

    constructor(app: App, plugin: uuidPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("uuid-key")
            .setDesc("key:value")
            .addText((text) =>
                text
                    .setPlaceholder("Enter your uuid key")
                    .setValue(this.plugin.settings.uuidKey)
                    .onChange(async (value) => {
                        this.plugin.settings.uuidKey = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("blacklist")
            .setDesc("黑名单，includes()逻辑，每行一个文件路径，换行分隔")
            .addTextArea((text) =>
                text
                    .setPlaceholder("黑名单")
                    .setValue(this.plugin.settings.blacklist.join("\n"))
                    .onChange(async (value) => {
                        this.plugin.settings.blacklist = value.split("\n");
                        await this.plugin.saveSettings();
                    })
            );
        new Setting(containerEl)
            .setName("whitelisy")
            .setDesc("白名单，includes()逻辑，每行一个文件路径，换行分隔")
            .addTextArea((text) =>
                text
                    .setPlaceholder("白名单")
                    .setValue(this.plugin.settings.whitelist.join("\n"))
                    .onChange(async (value) => {
                        this.plugin.settings.whitelist = value.split("\n");
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(this.containerEl)
            .setName("uuidStyle")
            .setDesc(`uuid生成算法`)
            .addDropdown((dd) => {
                dd.addOption("1", "ulid随机字符串");
                dd.addOption("2", "时间戳yyyyMMdd_hhmmss");
                dd.setValue(this.plugin.settings.uuidStyle.toString());
                dd.onChange(async (value) => {
                    this.plugin.settings.uuidStyle = parseInt(value);
                    await this.plugin.saveSettings();
                });
            });
    }
}
