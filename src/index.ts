/*
 * Copyright (c) 2023 by Yp Z (frostime). All Rights Reserved.
 * @Author       : Yp Z
 * @Date         : 2023-09-21 21:42:01
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2024-04-06 21:27:05
 * @Description  : 
 */
import {
    Plugin,
    Menu,
    Dialog,
    Protyle,
    showMessage
} from "siyuan";
import "@/index.scss";

import { setBlockAttrs } from "./api";
import Config from "./config.svelte";
import { setI18n, Type2Name } from "./utils";

const ATTR_TEMPLATE = "attr-template";

const ParseKeyName = (key: string) => {
    if (key.startsWith('@')) {
        return key.substring(1);
    }
    return `custom-${key}`;
}

const addBlockAttr = async (blockId: BlockId, template: object) => {
    console.info(`Add block attr: ${blockId}: ${JSON.stringify(template)}`);
    let blockAttrs = {};
    for (let key in template) {
        if (key === '@slash') continue;
        blockAttrs[ParseKeyName(key)] = template[key];
    }
    await setBlockAttrs(blockId, blockAttrs);
}

// const AddBlockAttrEvent = async (e: CustomEvent) => {
//     const { id, attr } = e.detail;
//     await addBlockAttr(id, attr);
// }

const IconForm = `
<symbol id="iconForm" viewBox="0 0 1024 1024"><path d="M80 128v752h848V128H80z m240 672H160v-144h160v144z m0-224H160v-144h160v144z m528 224H400v-144h448v144z m0-224H400v-144h448v144z m0-224H160v-144h688v144z" p-id="4869"></path></symbol>
`;

export default class PluginQuickAttr extends Plugin {

    private blockIconEventBindThis = this.blockIconEvent.bind(this);
    private docIconEventBindThis = this.docIconEvent.bind(this);

    private templates: {[key: string]: any} = {};

    async onload() {
        this.addIcons(IconForm);
        setI18n(this.i18n);
        this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
        this.eventBus.on("click-editortitleicon", this.docIconEventBindThis);
        //@ts-ignore
        // this.eventBus.on("add-block-attr", AddBlockAttrEvent);
    }

    async onLayoutReady() {
        // this.loadData(STORAGE_NAME);
        let data: any = await this.loadData(ATTR_TEMPLATE);
        if (data) {
            this.templates = data;
            this.parseProtyleSlash();
        }
    }

    async onunload() {
        this.saveData(ATTR_TEMPLATE, this.templates);
        this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
        this.eventBus.off("click-editortitleicon", this.docIconEventBindThis);
        //@ts-ignore
        // this.eventBus.off("add-block-attr", AddBlockAttrEvent);
    }

    /**
     * 根据 this.template 解析那些 Slash 命令
     * 设置 `@slash` 属性，则可以在编辑器中通过输入 `/` 命令快速为正在编辑中的块添加相应的属性。
     */
    private parseProtyleSlash(templates?: any) {
        templates = templates || this.templates;

        let slash = [];
        console.debug('Parse protyle slash');
        //check unique @slash key
        let slashKeys = new Set<string>();
        for (const key in templates) {
            let template = templates[key];
            if (template["@slash"]) {
                if (slashKeys.has(template["@slash"])) {
                    showMessage(`@slash: "${template["@slash"]}" is not unique`, 5000, 'error');
                    return false;
                }
                slashKeys.add(template["@slash"]);
                slash.push({
                    filter: [template["@slash"]],
                    html: `Quick Attr | ${key}`,
                    id: `quick-attr-${key}`,
                    callback: async (protyle: Protyle) => {
                        const selection = window.getSelection();
                        const focusNode: Node = selection?.focusNode;
                        if (!focusNode) {
                            showMessage(`Failed, can't find focus node`, 5000, 'error');
                            return;
                        }
                        let ele: HTMLElement = focusNode.nodeType === Node.TEXT_NODE ? focusNode.parentElement : focusNode as HTMLElement;
                        const blockElement: HTMLElement = ele.closest("div[data-node-id]");
                        if (!blockElement) {
                            showMessage(`Failed, can't find block`, 5000, 'error');
                            return;
                        }
                        await addBlockAttr(blockElement.getAttribute('data-node-id'), template);
                        //@ts-ignore; 注意，为了属性设置能够生效，必须把 protyle.insert 放到最后一步执行
                        protyle.insert(window.Lute.Caret, false, false); //插入特殊字符清除 slash
                    }
                });
            }
        }
        this.protyleSlash = slash;
        return true;
    }

    openSetting(): void {
        let dialog = new Dialog({
            title: this.i18n.name,
            content: `<div id="AttrTemplates" class="b3-dialog__content"></div>`,
            width: "600px",
            height: "700px",
        });
        const config = new Config({
            target: dialog.element.querySelector("#AttrTemplates"),
            props: {
                templates: this.templates,
            }
        });
        config.$on("save", (event: any) => {
            const flag = this.parseProtyleSlash(event.detail);
            if (!flag) {
                return;
            }
            this.templates = event.detail;
            this.saveData(ATTR_TEMPLATE, this.templates);
            dialog.destroy();
        });
        config.$on("cancel", () => {
            dialog.destroy();
        });
    }

    private createGlobalSubMenus(ids: string[]) {
        let submenus = [];
        for (const key in this.templates) {
            if (key.startsWith('@type/')) {
                continue;
            }
            let template = this.templates[key];
            submenus.push({
                label: key,
                click: async () => {
                    let promises: Promise<any>[] = [];
                    ids.forEach((id) => {
                        promises.push(addBlockAttr(id, template));
                    });
                    await Promise.all(promises);
                }
            });
        }
        return submenus;
    }

    private createSpecificSubMenus(id: BlockId, dataType: string) {
        let submenus = [];
        for (const key in this.templates) {
            if (key.startsWith('@type/')) {
                continue;
            }
            let template = this.templates[key];
            submenus.push({
                label: key,
                click: async () => {
                    await addBlockAttr(id, template);
                }
            });
        }
        let typeName = Type2Name?.[dataType];
        let typeSpecifiedTemplate = this.templates?.[typeName];
        if (typeSpecifiedTemplate !== undefined) {
            for (const key in typeSpecifiedTemplate) {
                let template = typeSpecifiedTemplate[key];
                submenus.push({
                    label: key,
                    click: async () => {
                        await addBlockAttr(id, template);
                    }
                });
            }
        }
        return submenus;
    }

    private blockIconEvent({ detail }: any) {
        // console.debug(detail);
        const ids: string[] = [];
        detail.blockElements.forEach((item: HTMLElement) => {
            ids.push(item.getAttribute("data-node-id"));
        });
        let submenus = [];
        if (ids.length > 1) {
            submenus = this.createGlobalSubMenus(ids);
        } else {
            submenus = this.createSpecificSubMenus(ids[0], detail.blockElements[0].getAttribute('data-type'));
        }
        (detail.menu as Menu).addItem({
            icon: "iconForm",
            type: "submenu",
            label: this.i18n.addattr,
            submenu: submenus
        });
    }

    private docIconEvent({ detail }: any) {
        // console.debug(detail);
        let docId: DocumentId = detail.data.id;
        let submenus = this.createSpecificSubMenus(docId, 'NodeDocument');
        (detail.menu as Menu).addItem({
            icon: "iconForm",
            type: "submenu",
            label: this.i18n.addattr,
            submenu: submenus
        });
    }
}
