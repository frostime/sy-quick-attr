<!--
 Copyright (c) 2023 by Yp Z (frostime). All Rights Reserved.
 Author       : Yp Z
 Date         : 2023-09-21 22:18:27
 FilePath     : /src/config.svelte
 LastEditTime : 2024-01-24 20:59:20
 Description  : 
-->
<script lang="ts">
    import { showMessage } from "siyuan";
    import { createEventDispatcher } from "svelte";
    import { i18n, Name2Type } from "./utils";

    export let templates: any;
    let jsonstr = JSON.stringify(templates, null, 4);

    let textarea: HTMLTextAreaElement;

    const dispatch = createEventDispatcher();

    const onInput = (e: any) => {
        //tab
        if (e.keyCode === 9) {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const target = e.target as HTMLTextAreaElement;
            const value = target.value;
            target.value =
                value.substring(0, start) + "    " + value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 4;
        }
    }

    const onCancel = () => {
        dispatch("cancel");
    }

    const onSave = () => {
        let text = textarea.value;
        try {
            let json = JSON.parse(text);
            if (checkJsonFormat(json)) {
                dispatch("save", json);
            }
        } catch (e) {
            showMessage(i18n.msg.jsongrammar, 5000, "error");
            // console.debug(e);
            return;
        }
    }

    const checkJsonFormat = (json: object): boolean => {
        //1. Json 规则必须是一个对象
        if (typeof json !== "object") {
            showMessage(i18n.msg.jsonstd, 5000, "error");
            return false;
        }
        const validKey = /^@?[\w\-]+$/; //允许一个可选的 @ 前缀
        // 每一个 key 代表一个规则的名称代号
        for (let key in json) {

            // -------------------- 类型过滤规则 --------------------
            if (key.startsWith('@type/')) {
                //特殊规则: 块属性过滤
                if (Name2Type?.[key] === undefined) {
                    //说明 key 不在合法的过滤规则里
                    showMessage(`${key}: ${i18n.msg.invalidRule}`, 5000, "error");
                    return false;
                }
                //递归地检查过滤规则内部的模板定义
                let flag = checkJsonFormat(json[key]);
                if (flag === false) {
                    return false;
                }
                continue;
            }
            // ------------------------------------------------


            //2. 每一个 json[key] 代表了一个规则集合，他必须是一个对象
            if (typeof json[key] !== "object") {
                showMessage(`${key}: ${i18n.msg.jsonstd}`, 5000, "error");
                return false;
            }

            //3. 检查规则集合内部的每条规则，必须是一个 validKey: string 的键值对
            let template = json[key];
            for (let key2 in template) {
                if (typeof template[key2] !== "string") {
                    showMessage(`${key}.${key2}: ${i18n.msg.muststring}`, 5000, "error");
                    return false;
                }
                if (!validKey.test(key2)) {
                    showMessage(`${key}.${key2}: ${i18n.msg.keyformat}`, 5000, "error");
                    return false;
                }
            }
        }
        return true;
    }

</script>

<section
    style="display: flex; flex-direction: column; height: 100%;"
>
    <div
        data-type="Header"
        class="fn__flex b3-label"
        style="align-items: center;"
    >
        <div class="fn__flex-1">
            <h4>{i18n.predefine.title}</h4>
        </div>
        <div class="b3-label__text" style="text-align: right;">
            {i18n.predefine.text}
        </div>
    </div>
    <div class="b3-label fn__flex-1">
        <textarea
            class="b3-text-field fn__block"
            value={jsonstr}
            bind:this={textarea}
            on:keydown={onInput}
        />
    </div>
    <div class="b3-label fn__flex" style="">
        <div class="fn__flex-1"></div>
        <button class="b3-button" on:click={onCancel}>{i18n.cancel}</button>
        <span class="fn__space"/>
        <button class="b3-button" on:click={onSave}>{i18n.save}</button>
    </div>
</section>

<style lang="scss">
    textarea {
        //render space
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
            Courier, monospace;
        // min-height: 17rem;
        height: 100%
    }
</style>
