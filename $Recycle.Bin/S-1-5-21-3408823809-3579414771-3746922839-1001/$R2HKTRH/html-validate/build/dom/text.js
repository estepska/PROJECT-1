"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextNode = void 0;
const domnode_1 = require("./domnode");
const dynamic_value_1 = require("./dynamic-value");
const nodetype_1 = require("./nodetype");
const TEXT_NODE_NAME = "#text";
/**
 * Represents a text in the HTML document.
 *
 * Text nodes are appended as children of `HtmlElement` and cannot have childen
 * of its own.
 */
class TextNode extends domnode_1.DOMNode {
    /**
     * @param text - Text to add. When a `DynamicValue` is used the expression is
     * used as "text".
     * @param location - Source code location of this node.
     */
    constructor(text, location) {
        super(nodetype_1.NodeType.TEXT_NODE, TEXT_NODE_NAME, location);
        this.text = text;
    }
    /**
     * Get the text from node.
     */
    get textContent() {
        return this.text.toString();
    }
    /**
     * Flag set to true if the attribute value is static.
     */
    get isStatic() {
        return !this.isDynamic;
    }
    /**
     * Flag set to true if the attribute value is dynamic.
     */
    get isDynamic() {
        return this.text instanceof dynamic_value_1.DynamicValue;
    }
}
exports.TextNode = TextNode;
