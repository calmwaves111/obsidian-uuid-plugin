import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";
import { ulid } from "ulid";
interface uuidPluginSettings {
	uuidKey: string;
}

const DEFAULT_SETTINGS: uuidPluginSettings = {
	uuidKey: "uuid",
};

let expSettings: uuidPluginSettings;
function getSetting(app: App) {
	return expSettings;
}
function addID(app: App): (f: TFile) => Promise<void> {
	return async function (f: TFile): Promise<void> {
		const key = getSetting(this.app).uuidKey;
		if (!app.metadataCache.getFileCache(f)?.frontmatter?.[key]) {
			await app.fileManager.processFrontMatter(f, (data) => {
				data[key] = ulid();
			});
		}
		else {
			new Notice(`${f.name} 中uuid已经存在`, 1000);
		}
	};
}

function addIDsToAllNotes(app: App) {
	const _addID = addID(this.app);
	return function () {
		app.vault.getMarkdownFiles().forEach((f) => _addID(f));
	};
}

function addIDsToCurrentNotes(app: App) {
	const _addID = addID(this.app);
	return function () {
		const currentFile = app.workspace.getActiveFile();
		if (!currentFile) {
			return;
		}
		if(currentFile.extension!="md"){
			new Notice("当前文件不是md笔记",1000);
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
			id: "add-ids-to-all-notes",
			name: "Add an ID to all notes",
			callback: addIDsToAllNotes(this.app),
		});

		this.addCommand({
			id: "add-ids-to-current-note",
			name: "Add an ID to current note",
			callback: addIDsToCurrentNotes(this.app),
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
	}
}
