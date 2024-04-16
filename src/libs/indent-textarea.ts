/**
 * @Declaration Copyfrom a MIT licensed project, with slight modifications.
 * @URL https://github.com/fregante/indent-textarea
 * @license MIT
 * @OriginAuthor Federico Brigante
 * @ModifiedBy frostime
 * ----------------------------------------------------------------------------
MIT License

Copyright (c) Federico Brigante <me@fregante.com> (https://fregante.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { insertTextIntoField } from 'text-field-edit';


export function indentSelection(element: HTMLTextAreaElement): void {
    const { selectionStart, selectionEnd, value } = element;
    const selectedText = value.slice(selectionStart, selectionEnd);
    // The first line should be indented, even if it starts with `\n`
    // The last line should only be indented if includes any character after `\n`
    const lineBreakCount = /\n/g.exec(selectedText)?.length;

    if (lineBreakCount! > 0) {
        // Select full first line to replace everything at once
        const firstLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;

        const newSelection = element.value.slice(firstLineStart, selectionEnd - 1);
        const indentedText = newSelection.replaceAll(
            /^|\n/g, // Match all line starts
            '$&    ',
        );
        const replacementsCount = indentedText.length - newSelection.length;

        // Replace newSelection with indentedText
        element.setSelectionRange(firstLineStart, selectionEnd - 1);
        insertTextIntoField(element, indentedText);

        // Restore selection position, including the indentation
        element.setSelectionRange(selectionStart + 4, selectionEnd + replacementsCount);
    } else {
        insertTextIntoField(element, '    ');
    }
}

function findLineEnd(value: string, currentEnd: number): number {
    // Go to the beginning of the last line
    const lastLineStart = value.lastIndexOf('\n', currentEnd - 1) + 1;

    // There's nothing to unindent after the last cursor, so leave it as is
    if (value.charAt(lastLineStart) !== '\t') {
        return currentEnd;
    }

    return lastLineStart + 1; // Include the first character, which will be a tab
}

// The first line should always be unindented
// The last line should only be unindented if the selection includes any characters after `\n`
export function unindentSelection(element: HTMLTextAreaElement): void {
    const { selectionStart, selectionEnd, value } = element;

    // Select the whole first line because it might contain \t
    const firstLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const minimumSelectionEnd = findLineEnd(value, selectionEnd);

    const newSelection = element.value.slice(firstLineStart, minimumSelectionEnd);
    const indentedText = newSelection.replaceAll(
        /(^|\n)(\t| {1,4})/g,
        '$1',
    );
    const replacementsCount = newSelection.length - indentedText.length;

    // Replace newSelection with indentedText
    element.setSelectionRange(firstLineStart, minimumSelectionEnd);
    insertTextIntoField(element, indentedText);

    
    const firstLineIndentation = /\t| {1,4}/.exec(value.slice(firstLineStart, selectionStart));

    const difference = firstLineIndentation
        ? firstLineIndentation[0]!.length
        : 0;

    const newSelectionStart = selectionStart - difference;
    element.setSelectionRange(
        selectionStart - difference,
        Math.max(newSelectionStart, selectionEnd - replacementsCount),
    );
}

/**
 * 分割 textarea 的行
 * @param textarea HTMLTextAreaElement
 * @param position number - The position index to split the text at
 * @returns
 *  - befores: string[], position 之前的行
 *  - line: string, position 所在的行
 *  - afters: string[], position 之后的行
 */
export const splitTextareaLines = (textarea: HTMLTextAreaElement, position: number) => {
    const text = textarea.value;

    // Guard against positions out of bounds
    if (position < 0 || position > text.length) {
        throw new Error('Position is out of bounds of the text length');
    }

    const befores = text.slice(0, position).split('\n');
    const afters = text.slice(position).split('\n');

    // Safely concatenate the current line, even if pop or shift return undefined
    const currentLineBefore = befores.pop() ?? '';
    const currentLineAfter = afters.shift() ?? '';
    const line = currentLineBefore + currentLineAfter;

    return { befores, line, afters };
}

export function tabToIndentListener(event: KeyboardEvent): void {
    if (
        event.defaultPrevented
        || event.metaKey
        || event.altKey
        || event.ctrlKey
    ) {
        return;
    }

    const textarea = event.target as HTMLTextAreaElement;

    if (event.key === 'Tab') {
        if (event.shiftKey) {
            unindentSelection(textarea);
        } else {
            indentSelection(textarea);
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    } else if (
        event.key === 'Escape'
        && !event.shiftKey
    ) {
        textarea.blur();
        event.preventDefault();
        event.stopImmediatePropagation();
    } else if (
        event.key === 'Enter'
        && !event.shiftKey
    ) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        if (start !== end) {
            // If there is no selection, just insert a newline
            return;
        }
        const position = textarea.selectionStart;

        const { line } = splitTextareaLines(textarea, position);
        //获取当前行前面的空格
        const whiteSpaceMatch = line.match(/^\s*/);
        const whiteSpace = whiteSpaceMatch ? whiteSpaceMatch[0] : '';

        //新开一行自动缩进
        insertTextIntoField(textarea, `\n${whiteSpace}`);
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}

type WatchableElements =
    | string
    | HTMLTextAreaElement
    | Iterable<HTMLTextAreaElement>;

export function enableTabToIndent(
    elements: WatchableElements,
    signal?: AbortSignal,
): void {
    if (typeof elements === 'string') {
        elements = document.querySelectorAll(elements);
    } else if (elements instanceof HTMLTextAreaElement) {
        elements = [elements];
    }

    for (const element of elements) {
        element.addEventListener('keydown', tabToIndentListener, { signal });
    }
}

