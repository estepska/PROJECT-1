"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMNode = exports.reset = void 0;
const nodetype_1 = require("./nodetype");
const DOCUMENT_NODE_NAME = "#document";
let counter = 0;
/* istanbul ignore next: only for testing */
function reset() {
    counter = 0;
}
exports.reset = reset;
class DOMNode {
    /**
     * Create a new DOMNode.
     *
     * @param nodeType - What node type to create.
     * @param nodeName - What node name to use. For `HtmlElement` this corresponds
     * to the tagName but other node types have specific predefined values.
     * @param location - Source code location of this node.
     */
    constructor(nodeType, nodeName, location) {
        this.nodeType = nodeType;
        this.nodeName = nodeName || DOCUMENT_NODE_NAME;
        this.location = location;
        this.disabledRules = new Set();
        this.childNodes = [];
        this.unique = counter++;
    }
    /**
     * Get the text (recursive) from all child nodes.
     */
    get textContent() {
        return this.childNodes.map((node) => node.textContent).join("");
    }
    append(node) {
        this.childNodes.push(node);
    }
    isRootElement() {
        return this.nodeType === nodetype_1.NodeType.DOCUMENT_NODE;
    }
    /**
     * Returns a DOMNode representing the first direct child node or `null` if the
     * node has no children.
     */
    get firstChild() {
        return this.childNodes[0] || null;
    }
    /**
     * Returns a DOMNode representing the last direct child node or `null` if the
     * node has no children.
     */
    get lastChild() {
        return this.childNodes[this.childNodes.length - 1] || null;
    }
    /**
     * Disable a rule for this node.
     */
    disableRule(ruleId) {
        this.disabledRules.add(ruleId);
    }
    /**
     * Disables multiple rules.
     */
    disableRules(rules) {
        for (const rule of rules) {
            this.disableRule(rule);
        }
    }
    /**
     * Enable a previously disabled rule for this node.
     */
    enableRule(ruleId) {
        this.disabledRules.delete(ruleId);
    }
    /**
     * Enables multiple rules.
     */
    enableRules(rules) {
        for (const rule of rules) {
            this.enableRule(rule);
        }
    }
    /**
     * Test if a rule is enabled for this node.
     */
    ruleEnabled(ruleId) {
        return !this.disabledRules.has(ruleId);
    }
    generateSelector() {
        return null;
    }
}
exports.DOMNode = DOMNode;
