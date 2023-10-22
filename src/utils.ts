import I18N from "./i18n/zh_CN.json";

export let i18n: typeof I18N;

export const setI18n = (i18nObj: any) => {
    i18n = i18nObj;
}

export const Name2Type = {
    "@type/d": "",
    "@type/h": "NodeHeading",
    "@type/p": "NodeParagraph",
    "@type/l": "NodeList",
    "@type/li": "NodeListItem",
    "@type/q": "NodeBlockquote",
    "@type/c": "NodeCodeBlock",
    "@type/t": "NodeTable",
    "@type/s": "NodeSuperBlock"
  };

export const Type2Name = {
    "NodeHeading": "@type/h",
    "NodeParagraph": "@type/p",
    "NodeList": "@type/l",
    "NodeListItem": "@type/li",
    "NodeBlockquote": "@type/q",
    "NodeCodeBlock": "@type/c",
    "NodeTable": "@type/t",
    "NodeSuperBlock": "@type/s"
};