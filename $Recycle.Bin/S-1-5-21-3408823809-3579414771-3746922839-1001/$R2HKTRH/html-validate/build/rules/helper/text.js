"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyNodeText = exports.TextClassification = void 0;
const dom_1 = require("../../dom");
var TextClassification;
(function (TextClassification) {
    TextClassification[TextClassification["EMPTY_TEXT"] = 0] = "EMPTY_TEXT";
    TextClassification[TextClassification["DYNAMIC_TEXT"] = 1] = "DYNAMIC_TEXT";
    TextClassification[TextClassification["STATIC_TEXT"] = 2] = "STATIC_TEXT";
})(TextClassification = exports.TextClassification || (exports.TextClassification = {}));
/**
 * Checks text content of an element.
 *
 * Any text is considered including text from descendant elements. Whitespace is
 * ignored.
 *
 * If any text is dynamic `TextClassification.DYNAMIC_TEXT` is returned.
 */
function classifyNodeText(node) {
    const text = findTextNodes(node);
    /* if any text is dynamic classify as dynamic */
    if (text.some((cur) => cur.isDynamic)) {
        return TextClassification.DYNAMIC_TEXT;
    }
    /* if any text has non-whitespace character classify as static */
    if (text.some((cur) => cur.textContent.match(/\S/) !== null)) {
        return TextClassification.STATIC_TEXT;
    }
    /* default to empty */
    return TextClassification.EMPTY_TEXT;
}
exports.classifyNodeText = classifyNodeText;
function findTextNodes(node) {
    let text = [];
    for (const child of node.childNodes) {
        switch (child.nodeType) {
            case dom_1.NodeType.TEXT_NODE:
                text.push(child);
                break;
            case dom_1.NodeType.ELEMENT_NODE:
                text = text.concat(findTextNodes(child));
                break;
            /* istanbul ignore next: provides a sane default, nothing to test */
            default:
                break;
        }
    }
    return text;
}
