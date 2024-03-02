import {
    App,
    Notice,
    Plugin,
    PluginSettingTab,
    Setting,
    TFile,
    moment,
} from "obsidian";
import ShortUniqueId from "short-unique-id";
interface uuidPluginSettings {
    uuidKey: string;
    uuidLength: number;
    blacklist: string[];
    whitelist: string[];
    uuidStyle: number;
    dateFormat: string;
}

const DEFAULT_SETTINGS: uuidPluginSettings = {
    uuidKey: "uuid",
    uuidLength: 10,
    blacklist: [],
    whitelist: [],
    uuidStyle: 1,
    dateFormat: "YYYYMMDD_hhmmss",
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
                const uidlen = getSettings(app).uuidLength;
                const uid = new ShortUniqueId({ length: uidlen });
                uuid = uid.rnd();
            } else {
                const ctime = new Date(f.stat.ctime); // 将时间戳转换为 Date 对象，f.stat.ctime是个number
                const formattedTime = moment(ctime).format(
                    getSettings(app).dateFormat
                ); // 使用 Moment.js 格式化时间戳
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
            .setDesc("uuid的key值，默认为uuid")
            .addText((text) =>
                text
                    .setPlaceholder(DEFAULT_SETTINGS.uuidKey)
                    .setValue(this.plugin.settings.uuidKey)
                    .onChange(async (value) => {
                        if (value.trim() === "") {
                            this.plugin.settings.uuidKey =
                                DEFAULT_SETTINGS.uuidKey;
                        } else {
                            this.plugin.settings.uuidKey = value;
                        }
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("uuid-Length")
            .setDesc("uuid的长度，默认为10")
            .addText((text) =>
                text
                    // .setPlaceholder(this.plugin.settings.uuidLength.toString()) // 将上一次设定的长度数字转换为字符串作为占位符
                    .setPlaceholder(DEFAULT_SETTINGS.uuidLength.toString()) // 将数字转换为字符串作为占位符
                    .setValue(this.plugin.settings.uuidLength.toString())
                    .onChange(async (value) => {
                        const intValue = parseInt(value);
                        if (!isNaN(intValue)) {
                            this.plugin.settings.uuidLength = intValue;
                            await this.plugin.saveSettings();
                        } else {
                            this.plugin.settings.uuidLength =
                                DEFAULT_SETTINGS.uuidLength;
                            // new Notice("请输入有效的数字作为 uuid 长度");
                        }
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
            .setName("whitelist")
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
                dd.addOption("2", "创建时间戳");
                dd.setValue(this.plugin.settings.uuidStyle.toString());
                dd.onChange(async (value) => {
                    this.plugin.settings.uuidStyle = parseInt(value);
                    await this.plugin.saveSettings();
                });
            });

        const dateFormatSettingDescription = new DocumentFragment();
        dateFormatSettingDescription.createEl("span", {
            text: "请在uuidStyle中选择“创建时间戳”，格式参考 ",
        });
        dateFormatSettingDescription.appendChild(
            createEl("a", {
                text: "moment.js",
                href: "https://momentjs.com/docs/#/displaying/format/",
            })
        );
        dateFormatSettingDescription.createEl("br"); // 添加换行
        dateFormatSettingDescription.appendText("当前所用格式的样例: ");

        // 创建一个 span 元素用于显示当前时间戳格式的样例
        const currentFormatExampleSpan = createEl("span", {
            text: moment().format(this.plugin.settings.dateFormat),
        });
        dateFormatSettingDescription.appendChild(currentFormatExampleSpan);

        new Setting(this.containerEl)
            .setName("时间戳格式")
            .setDesc(dateFormatSettingDescription)
            .addText((text) =>
                text
                    .setPlaceholder("YYYYMMDD_HHmmss")
                    .setValue(this.plugin.settings.dateFormat)
                    .onChange(async (value) => {
                        if (value.trim() === "") {
                            this.plugin.settings.dateFormat =
                                DEFAULT_SETTINGS.dateFormat;
                        } else {
                            this.plugin.settings.dateFormat = value;
                        }
                        await this.plugin.saveSettings();
                        // 更新当前时间戳格式的样例
                        currentFormatExampleSpan.innerText =
                            moment().format(this.plugin.settings.dateFormat);
                    })
            );
    }
}
