<!--
 Copyright (c) 2023 by Yp Z (frostime). All Rights Reserved.
 Author       : Yp Z
 Date         : 2023-09-21 22:18:27
 FilePath     : /src/config.svelte
 LastEditTime : 2023-09-22 10:19:07
 Description  : 
-->
<script lang="ts">
    import { showMessage } from "siyuan";
    import { createEventDispatcher } from "svelte";
    import { i18n } from "./utils";

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
        if (typeof json !== "object") {
            showMessage(i18n.msg.jsonstd, 5000, "error");
            return false;
        }
        for (let key in json) {
            if (typeof json[key] !== "object") {
                showMessage(`${key}: ${i18n.msg.jsonstd}`, 5000, "error");
                return false;
            }
            let template = json[key];
            for (let key2 in template) {
                if (typeof template[key2] !== "string") {
                    showMessage(`${key}.${key2}: ${i18n.msg.muststring}`, 5000, "error");
                    return false;
                }
            }
        }
        return true;
    }

</script>

<div
    class="config__tab-container"
    style="display: flex; flex-direction: column;"
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
    <div class="b3-label fn__flex-1" style="border-bottom: 1px solid var(--b3-border-color)">
        <textarea
            class="b3-text-field fn__block"
            style="height: 100%"
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
</div>

<style lang="scss">
    textarea {
        //render space
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
            Courier, monospace;
    }
</style>
