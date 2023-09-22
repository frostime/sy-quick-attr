/*
 * Copyright (c) 2023 by Yp Z (frostime). All Rights Reserved.
 * @Author       : Yp Z
 * @Date         : 2023-09-21 21:42:01
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2023-09-22 10:23:22
 * @Description  : 
 */
import {
    Plugin,
    Menu,
    Dialog,
    getFrontend,
    getBackend,
} from "siyuan";
import "@/index.scss";

import { getBlockAttrs, setBlockAttrs } from "./api";
import Config from "./config.svelte";
import { setI18n } from "./utils";

const ATTR_TEMPLATE = "attr-template";

const addBlockAttr = async (blockId: BlockId, template: object) => {
    let blockAttrs = await getBlockAttrs(blockId);
    console.info(blockAttrs);
    for (let key in blockAttrs) {
        if (!key.startsWith("custom-")) {
            delete blockAttrs[key];
        }
    }
    for (let key in template) {
        blockAttrs[`custom-${key}`] = template[key];
    }
    await setBlockAttrs(blockId, blockAttrs);
}

const IconForm = `
<symbol id="iconForm" viewBox="0 0 1024 1024"><path d="M80 128v752h848V128H80z m240 672H160v-144h160v144z m0-224H160v-144h160v144z m528 224H400v-144h448v144z m0-224H400v-144h448v144z m0-224H160v-144h688v144z" p-id="4869"></path></symbol>
`;

export default class PluginSample extends Plugin {

    private blockIconEventBindThis = this.blockIconEvent.bind(this);

    private templates: {[key: string]: any} = {};

    async onload() {
        this.addIcons(IconForm);
        setI18n(this.i18n);
        this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
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

    private blockIconEvent({ detail }: any) {
        const ids: string[] = [];
        detail.blockElements.forEach((item: HTMLElement) => {
            ids.push(item.getAttribute("data-node-id"));
        });
        let submenus = [];
        for (const key in this.templates) {
            let template = this.templates[key];
            submenus.push({
                icon: "#iconForm",
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
        (detail.menu as Menu).addItem({
            type: "submenu",
            label: this.i18n.addattr,
            submenu: submenus
        });
    }
}
