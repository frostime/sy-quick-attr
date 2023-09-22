import I18N from "./i18n/zh_CN.json";

export let i18n: typeof I18N;

export const setI18n = (i18nObj: any) => {
    i18n = i18nObj;
}

