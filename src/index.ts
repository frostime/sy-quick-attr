/*
 * Copyright (c) 2023 by Yp Z (frostime). All Rights Reserved.
 * @Author       : Yp Z
 * @Date         : 2023-09-21 21:42:01
 * @FilePath     : /src/index.ts
 * @LastEditTime : 2024-11-03 14:27:34
 * @Description  : 
 */
import {
    Plugin,
    Menu,
    Dialog,
    Protyle,
    showMessage,
    confirm,
    type IEventBusMap
} from "siyuan";
import "@/index.scss";

import { setBlockAttrs, getBlockAttrs } from "./api";
import Config from "./config.svelte";
import { setI18n, Type2Name, TTypeName, QueryClosetElement, i18n } from "./libs/utils";

const ATTR_TEMPLATE = "attr-template";

const ParseKeyName = (key: string) => {
    if (key.startsWith('@')) {
        return key.substring(1);
    }
    return `custom-${key}`;
}

const coreKey = new Set(['id', 'name', 'alias', 'memo', 'bookmark', 'style']);
//TODO Use this
const ensureSyFormat = (key: string) => {
    if (key.startsWith('custom-')) return key;
    if (key.startsWith('@')) {
        key = key.substring(1);
        if (coreKey.has(key)) {
            return key;
        } else {
            return null;
        }
    }
    return `custom-${key}`;
}
const ensurePluginFormat = (key: string) => {
    //查看是否为思源的属性格式
    if (key.startsWith('custom-')) return key.substring(7);
    //检查内置属性
    if (key.startsWith('@')) {
        key = key.substring(1);
        if (coreKey.has(key)) {
            return `@${key}`;
        } else {
            return null;
        }
    }
    return key;
}

const buildInputDom = (attrs: {}, keys: string[], keyInputType: Map<string, string>) => {
    let items = [];

    keys.forEach((key) => {
        const val = attrs?.[key] ?? '';
        let inputType = keyInputType.get(key) ?? 'input';
        let ele: string;
        if (inputType === 'input') {
            ele = `<input type="text" class="b3-text-field attr-value" data-key="${key}" value="${val}" style="flex: 1;"/>`;
        } else if (inputType.startsWith('select')) {
            const pat = /select:(?:(.+)[,;]?)+/;
            const textlist = [];
            if (pat.test(inputType)) {
                let match = inputType.match(pat);
                let list = match[1].split(/[,;]/);
                list.forEach((item) => {
                    item = item.trim();
                    let selected = item === val ? 'selected' : '';
                    let option = `<option value="${item}" ${selected}>${item}</option>`
                    textlist.push(option);
                });
                ele = `
                <select class="b3-select attr-value" data-key="${key}" style="flex: 1;">
                    ${textlist.join('\n')}
                </select>
                `;
            }
        } else {
            return;
        }
        let html = `
        <div class="input-item" style="display: flex; gap: 5px;">
            <label style="width: 100px; font-weight: bold;">${key}</label>
            ${ele}
        </div>
        `;
        items.push(html);
    });
    return `<div style="display: flex; flex-direction: column; gap: 10px; height: 100%;">
        ${items.join('\n')}
    </div>`;
}

/**
 * 为指定的块添加属性
 * @param blockId 
 * @param template 
 * @param clearCb 执行 protyle 清理的回调函数; 仅仅在使用 /slash 命令的情况下调用
 * @returns 
 */
const addBlockAttr = async (blockId: BlockId, template: object) => {
    let blockAttrs = {};
    let userDefinedAttrs = new Set<string>();  //提示需要 @value 的属性
    let userDefinedAttrsInputType = new Map<string, string>(); //用户自定义属性的输入类型
    for (let key in template) {
        if (key === '@slash') continue;
        if (template[key].startsWith('@value')) {
            userDefinedAttrs.add(key);
            let inputTyle = template[key].split('/')?.[1] ?? 'input';
            userDefinedAttrsInputType.set(key, inputTyle);
        } else {
            blockAttrs[ParseKeyName(key)] = template[key];
        }
    }
    //获取用户需要自行输入设置的属性中，是否已经存在对应的属性
    let currentAttrs = await getBlockAttrs(blockId);
    let existAttrs = {};
    const UnParse = (key: string) => key.startsWith('custom-') ? key.substring(7) : `@${key}`;
    for (let key in currentAttrs) {
        if (key === 'id') continue; //id 属性不可修改
        let val = currentAttrs[key];
        key = UnParse(key); //去掉 custom- 前缀；将内置属性转换为 @key
        if (userDefinedAttrs.has(key)) {
            existAttrs[key] = val;
        }
    }

    //用户输入，覆盖默认属性
    if (userDefinedAttrs.size > 0) {
        // clearCb?.(); //以下会更改鼠标焦点，所以要在之前清理 Protyle 的 slash
        let attrs: {} | null = await new Promise((resolve) => {
            confirm(i18n.userDefineAttr, buildInputDom(existAttrs, Array.from(userDefinedAttrs), userDefinedAttrsInputType), (dialog: Dialog) => {
                let inputs = dialog.element.querySelectorAll('.attr-value');
                let attrs = {};
                inputs.forEach((input: HTMLInputElement | HTMLSelectElement) => {
                    let key = input.getAttribute('data-key');
                    attrs[ParseKeyName(key)] = input.value;
                });
                dialog.destroy();
                resolve(attrs);
            }, () => {
                resolve(null);
            });
        });

        if (attrs === null) {
            return;
        }
        blockAttrs = { ...blockAttrs, ...attrs };

    }

    await setBlockAttrs(blockId, blockAttrs);
    console.debug(`Add block attr: ${blockId}: ${JSON.stringify(blockAttrs)}`);
}


const IconForm = `
<symbol id="iconForm" viewBox="0 0 1024 1024"><path d="M80 128v752h848V128H80z m240 672H160v-144h160v144z m0-224H160v-144h160v144z m528 224H400v-144h448v144z m0-224H400v-144h448v144z m0-224H160v-144h688v144z" p-id="4869"></path></symbol>
`;

export default class PluginQuickAttr extends Plugin {

    private blockIconEventBindThis = this.blockIconEvent.bind(this);
    private docIconEventBindThis = this.docIconEvent.bind(this);
    private treeItemEventBindThis = this.treeItemEvent.bind(this);

    private templates: { [key: string]: any } = {};

    async onload() {
        this.addIcons(IconForm);
        setI18n(this.i18n);
        this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
        this.eventBus.on("click-editortitleicon", this.docIconEventBindThis);
        this.eventBus.on("open-menu-doctree", this.treeItemEventBindThis);
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
        // this.saveData(ATTR_TEMPLATE, this.templates);
        this.eventBus.off("click-blockicon", this.blockIconEventBindThis);
        this.eventBus.off("click-editortitleicon", this.docIconEventBindThis);
        this.eventBus.off("open-menu-doctree", this.treeItemEventBindThis);
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

        const parseTemplateUnit = (key: string, template: Object, filterType: 'default' | TTypeName = 'default') => {
            if (template?.["@slash"] === undefined) {
                return;
            }
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
                    let ele: HTMLElement = focusNode.nodeType === Node.TEXT_NODE ?
                        focusNode.parentElement : focusNode as HTMLElement;
                    let typeName = 'default';
                    if (filterType !== 'default') {
                        typeName = filterType === '@type/d' ? 'doctype' : 'nodetype';
                    }
                    const Query = QueryClosetElement?.[typeName];
                    if (Query) {
                        const blockId = Query(ele, filterType);
                        if (!blockId) {
                            showMessage(`Failed, can't find block`, 5000, 'error');
                        } else {
                            //避免和 protyle slash 的事件冲突导致设置失效
                            setTimeout(() => {
                                addBlockAttr(blockId, template);
                            }, 500);
                        }
                    }
                    protyle.insert(window.Lute.Caret, false, false); //插入特殊字符清除 slash
                }
            });
        }

        for (const key in templates) {
            let template = templates[key];
            if (!key.startsWith('@type/')) {
                parseTemplateUnit(key, template, 'default');
            } else {
                for (const tkey in template) {
                    let subTemplate = template[tkey];
                    parseTemplateUnit(tkey, subTemplate, key as TTypeName);
                }
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

    /**
     * 为特定类型的块创建子菜单
     * @param id 
     * @param dataType 
     * @returns 
     */
    private createSpecificSubMenus(id: BlockId | BlockId[], dataType: string) {
        let submenus = [];

        const clickCallback = async (template: Object) => {
            if (Array.isArray(id)) {
                let promises: Promise<any>[] = [];
                id.forEach((id) => {
                    promises.push(addBlockAttr(id, template));
                });
                await Promise.all(promises);
            } else {
                await addBlockAttr(id, template);
            }
        }

        for (const key in this.templates) {
            if (key.startsWith('@type/')) {
                continue;
            }
            let template = this.templates[key];
            submenus.push({
                label: key,
                click: async () => {
                    await clickCallback(template);
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
                        await clickCallback(template);
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

    private treeItemEvent(e: CustomEvent<IEventBusMap["open-menu-doctree"]>) {
        const { detail } = e;
        if (detail.type === 'notebook') {
            return;
        }
        if (detail.elements.length === 0) {
            return;
        }

        let docs = Array.from(detail.elements).map((item: HTMLElement) => item.getAttribute('data-node-id'));
        detail.menu.addItem({
            icon: "iconForm",
            label: this.i18n.addattr,
            submenu: this.createSpecificSubMenus(docs, 'NodeDocument')
        })
    }
}
