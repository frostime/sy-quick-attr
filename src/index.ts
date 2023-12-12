/*
 * Copyright (c) 2023 by Yp Z (frostime). All Rights Reserved.
 * @Author       : Yp Z
 * @Date         : 2023-09-21 21:42:01
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2023-12-12 11:03:49
 * @Description  : 
 */
import {
    Plugin,
    Menu,
    Dialog
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
    console.info(`Add block attr: ${blockId}: ${template}`);
    let blockAttrs = {};
    for (let key in template) {
        blockAttrs[ParseKeyName(key)] = template[key];
    }
    await setBlockAttrs(blockId, blockAttrs);
}

const IconForm = `
<symbol id="iconForm" viewBox="0 0 1024 1024"><path d="M80 128v752h848V128H80z m240 672H160v-144h160v144z m0-224H160v-144h160v144z m528 224H400v-144h448v144z m0-224H400v-144h448v144z m0-224H160v-144h688v144z" p-id="4869"></path></symbol>
`;

export default class PluginSample extends Plugin {

    private blockIconEventBindThis = this.blockIconEvent.bind(this);
    private docIconEventBindThis = this.docIconEvent.bind(this);

    private templates: {[key: string]: any} = {};

    async onload() {
        this.addIcons(IconForm);
        setI18n(this.i18n);
        this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
        this.eventBus.on("click-editortitleicon", this.docIconEventBindThis);
    }

    async onLayoutReady() {
        // this.loadData(STORAGE_NAME);
        let data: any = await this.loadData(ATTR_TEMPLATE);
        if (data) {
            this.templates = data;
        }
    }

    async onunload() {
        this.saveData(ATTR_TEMPLATE, this.templates);
        this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
        this.eventBus.off("click-editortitleicon", this.docIconEventBindThis);
    }

    openSetting(): void {
        let dialog = new Dialog({
            title: this.i18n.name,
            content: `<div id="AttrTemplates" class="b3-dialog__content"></div>`,
            width: "500px",
            height: "500px",
        });
        const config = new Config({
            target: dialog.element.querySelector("#AttrTemplates"),
            props: {
                templates: this.templates,
            }
        });
        config.$on("save", (event: any) => {
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
