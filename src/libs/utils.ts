/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-10-22 16:18:26
 * @FilePath     : /src/libs/utils.ts
 * @LastEditTime : 2024-05-25 16:47:04
 * @Description  : 
 */
import I18N from "@/i18n/zh_CN.json";

export let i18n: typeof I18N;

export const setI18n = (i18nObj: any) => {
    i18n = i18nObj;
}

export const Name2Type = {
    "@type/d": "NodeDocument",
    "@type/h": "NodeHeading",
    "@type/p": "NodeParagraph",
    "@type/l": "NodeList",
    "@type/li": "NodeListItem",
    "@type/q": "NodeBlockquote",
    "@type/c": "NodeCodeBlock",
    "@type/t": "NodeTable",
    "@type/s": "NodeSuperBlock"
};

export type TTypeName = keyof typeof Name2Type

export const Type2Name = {
    "NodeDocument": "@type/d",
    "NodeHeading": "@type/h",
    "NodeParagraph": "@type/p",
    "NodeList": "@type/l",
    "NodeListItem": "@type/li",
    "NodeBlockquote": "@type/q",
    "NodeCodeBlock": "@type/c",
    "NodeTable": "@type/t",
    "NodeSuperBlock": "@type/s"
};


type IQueryClosetElement = {
    [key: string]: (element: HTMLElement, args?: any) => BlockId | null;
}

/**
 * 获取到输入元素最临近的复合匹配条件的 block node element
 */
export const QueryClosetElement: IQueryClosetElement = {
    default: (ele: HTMLElement): BlockId | null => {
        //获取最近的 data-node-id
        ele = ele.closest("[data-node-id]");
        if (!ele) {
            return null;
        }
        if (ele.classList.contains("p")) {
            //如果是 p 元素，那么检查上方最近的 li 元素的第一个 p 子类元素是不是自己
            let li = ele.closest('[data-node-id].li');
            //选择 li 下的第一个 p 元素
            let p1st = li?.querySelector("[data-node-id].p");
            if (p1st && p1st.getAttribute("data-node-id") === ele.getAttribute("data-node-id")) {
                ele = ele.parentElement;
            }
        }
        return ele.getAttribute("data-node-id");
    },
    nodetype: (ele: HTMLElement, typeName: TTypeName): BlockId | null => {
        let NodeType = Name2Type[typeName];
        const selector = `[data-node-id][data-type="${NodeType}"]`;
        ele = ele.closest(selector);
        return ele?.getAttribute("data-node-id");
    },
    doctype: (ele: HTMLElement): BlockId | null => {
        let protyle = ele.closest("div.protyle-content");
        if (!protyle) {
            return null;
        }
        let protyleTitle = protyle.querySelector("div.protyle-title");
        return protyleTitle?.getAttribute("data-node-id");
    }
};
