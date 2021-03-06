"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlElement = exports.NodeClosed = void 0;
const context_1 = require("../context");
const meta_1 = require("../meta");
const attribute_1 = require("./attribute");
const domnode_1 = require("./domnode");
const domtokenlist_1 = require("./domtokenlist");
const nodetype_1 = require("./nodetype");
const selector_1 = require("./selector");
const text_1 = require("./text");
var NodeClosed;
(function (NodeClosed) {
    NodeClosed[NodeClosed["Open"] = 0] = "Open";
    NodeClosed[NodeClosed["EndTag"] = 1] = "EndTag";
    NodeClosed[NodeClosed["VoidOmitted"] = 2] = "VoidOmitted";
    NodeClosed[NodeClosed["VoidSelfClosed"] = 3] = "VoidSelfClosed";
    NodeClosed[NodeClosed["ImplicitClosed"] = 4] = "ImplicitClosed";
})(NodeClosed = exports.NodeClosed || (exports.NodeClosed = {}));
class HtmlElement extends domnode_1.DOMNode {
    constructor(tagName, parent, closed = NodeClosed.EndTag, meta, location) {
        const nodeType = tagName ? nodetype_1.NodeType.ELEMENT_NODE : nodetype_1.NodeType.DOCUMENT_NODE;
        super(nodeType, tagName, location);
        this.tagName = tagName;
        this.parent = parent;
        this.attr = {};
        this.metaElement = meta;
        this.closed = closed;
        this.voidElement = meta ? Boolean(meta.void) : false;
        this.depth = 0;
        this.annotation = null;
        if (parent) {
            parent.childNodes.push(this);
            /* calculate depth in domtree */
            let cur = parent;
            while (cur.parent) {
                this.depth++;
                cur = cur.parent;
            }
        }
    }
    static rootNode(location) {
        return new HtmlElement(undefined, undefined, undefined, undefined, location);
    }
    static fromTokens(startToken, endToken, parent, metaTable) {
        const tagName = startToken.data[2];
        if (!tagName) {
            throw new Error("tagName cannot be empty");
        }
        const meta = metaTable ? metaTable.getMetaFor(tagName) : null;
        const open = startToken.data[1] !== "/";
        const closed = isClosed(endToken, meta);
        /* location contains position of '<' so strip it out */
        const location = context_1.sliceLocation(startToken.location, 1);
        return new HtmlElement(tagName, open ? parent : undefined, closed, meta, location);
    }
    /**
     * Returns annotated name if set or defaults to `<tagName>`.
     *
     * E.g. `my-annotation` or `<div>`.
     */
    get annotatedName() {
        if (this.annotation) {
            return this.annotation;
        }
        else {
            return `<${this.tagName}>`;
        }
    }
    /**
     * Similar to childNodes but only elements.
     */
    get childElements() {
        return this.childNodes.filter((node) => node.nodeType === nodetype_1.NodeType.ELEMENT_NODE);
    }
    /**
     * Find the first ancestor matching a selector.
     *
     * Implementation of DOM specification of Element.closest(selectors).
     */
    closest(selectors) {
        /* eslint-disable-next-line @typescript-eslint/no-this-alias */
        let node = this;
        while (node) {
            if (node.matches(selectors)) {
                return node;
            }
            node = node.parent;
        }
        return null;
    }
    /**
     * Generate a DOM selector for this element. The returned selector will be
     * unique inside the current document.
     */
    generateSelector() {
        /* root element cannot have a selector as it isn't a proper element */
        if (this.isRootElement()) {
            return null;
        }
        const parts = [];
        let root;
        for (root = this; root.parent; root = root.parent) {
            /* .. */
        }
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        for (let cur = this; cur.parent; cur = cur.parent) {
            /* if a unique id is present, use it and short-circuit */
            if (cur.id) {
                const matches = root.querySelectorAll(`#${cur.id}`);
                if (matches.length === 1) {
                    parts.push(`#${cur.id}`);
                    break;
                }
            }
            const parent = cur.parent;
            const child = parent.childElements;
            const index = child.findIndex((it) => it.unique === cur.unique);
            const numOfType = child.filter((it) => it.is(cur.tagName)).length;
            const solo = numOfType === 1;
            /* if this is the only tagName in this level of siblings nth-child isn't needed */
            if (solo) {
                parts.push(cur.tagName.toLowerCase());
                continue;
            }
            /* this will generate the worst kind of selector but at least it will be accurate (optimizations welcome) */
            parts.push(`${cur.tagName.toLowerCase()}:nth-child(${index + 1})`);
        }
        return parts.reverse().join(" > ");
    }
    /**
     * Tests if this element has given tagname.
     *
     * If passing "*" this test will pass if any tagname is set.
     */
    is(tagName) {
        if (!this.tagName) {
            return false;
        }
        return (tagName === "*" || this.tagName.toLowerCase() === tagName.toLowerCase());
    }
    /**
     * Load new element metadata onto this element.
     *
     * Do note that semantics such as `void` cannot be changed (as the element has
     * already been created). In addition the element will still "be" the same
     * element, i.e. even if loading meta for a `<p>` tag upon a `<div>` tag it
     * will still be a `<div>` as far as the rest of the validator is concerned.
     *
     * In fact only certain properties will be copied onto the element:
     *
     * - content categories (flow, phrasing, etc)
     * - required attributes
     * - attribute allowed values
     * - permitted/required elements
     *
     * Properties *not* loaded:
     *
     * - inherit
     * - deprecated
     * - foreign
     * - void
     * - implicitClosed
     * - scriptSupporting
     * - deprecatedAttributes
     *
     * Changes to element metadata will only be visible after `element:ready` (and
     * the subsequent `dom:ready` event).
     */
    loadMeta(meta) {
        if (!this.metaElement) {
            this.metaElement = {};
        }
        for (const key of meta_1.MetaCopyableProperty) {
            if (typeof meta[key] !== "undefined") {
                this.metaElement[key] = meta[key];
            }
            else {
                delete this.metaElement[key];
            }
        }
    }
    /**
     * Match this element against given selectors. Returns true if any selector
     * matches.
     *
     * Implementation of DOM specification of Element.matches(selectors).
     */
    matches(selector) {
        /* find root element */
        /* eslint-disable-next-line @typescript-eslint/no-this-alias */
        let root = this;
        while (root.parent) {
            root = root.parent;
        }
        /* a bit slow implementation as it finds all candidates for the selector and
         * then tests if any of them are the current element. A better
         * implementation would be to walk the selector right-to-left and test
         * ancestors. */
        for (const match of root.querySelectorAll(selector)) {
            if (match.unique === this.unique) {
                return true;
            }
        }
        return false;
    }
    get meta() {
        return this.metaElement;
    }
    /**
     * Set annotation for this element.
     */
    setAnnotation(text) {
        this.annotation = text;
    }
    /**
     * Set attribute. Stores all attributes set even with the same name.
     *
     * @param key - Attribute name
     * @param value - Attribute value. Use `null` if no value is present.
     * @param keyLocation - Location of the attribute name.
     * @param valueLocation - Location of the attribute value (excluding quotation)
     * @param originalAttribute - If attribute is an alias for another attribute
     * (dynamic attributes) set this to the original attribute name.
     */
    setAttribute(key, value, keyLocation, valueLocation, originalAttribute) {
        key = key.toLowerCase();
        if (!this.attr[key]) {
            this.attr[key] = [];
        }
        this.attr[key].push(new attribute_1.Attribute(key, value, keyLocation, valueLocation, originalAttribute));
    }
    /**
     * Get a list of all attributes on this node.
     */
    get attributes() {
        return Object.values(this.attr).reduce((result, cur) => {
            return result.concat(cur);
        }, []);
    }
    hasAttribute(key) {
        key = key.toLowerCase();
        return key in this.attr;
    }
    getAttribute(key, all = false) {
        key = key.toLowerCase();
        if (key in this.attr) {
            const matches = this.attr[key];
            return all ? matches : matches[0];
        }
        else {
            return null;
        }
    }
    /**
     * Get attribute value.
     *
     * Returns the attribute value if present.
     *
     * - Missing attributes return `null`.
     * - Boolean attributes return `null`.
     * - `DynamicValue` returns attribute expression.
     *
     * @param {string} key - Attribute name
     * @return Attribute value or null.
     */
    getAttributeValue(key) {
        const attr = this.getAttribute(key);
        if (attr) {
            return attr.value !== null ? attr.value.toString() : null;
        }
        else {
            return null;
        }
    }
    /**
     * Add text as a child node to this element.
     *
     * @param text - Text to add.
     * @param location - Source code location of this text.
     */
    appendText(text, location) {
        this.childNodes.push(new text_1.TextNode(text, location));
    }
    /**
     * Return a list of all known classes on the element. Dynamic values are
     * ignored.
     */
    get classList() {
        if (!this.hasAttribute("class")) {
            return new domtokenlist_1.DOMTokenList(null);
        }
        const classes = this.getAttribute("class", true)
            .filter((attr) => attr.isStatic)
            .map((attr) => attr.value)
            .join(" ");
        return new domtokenlist_1.DOMTokenList(classes);
    }
    /**
     * Get element ID if present.
     */
    get id() {
        return this.getAttributeValue("id");
    }
    get siblings() {
        return this.parent.childElements;
    }
    get previousSibling() {
        const i = this.siblings.findIndex((node) => node.unique === this.unique);
        return i >= 1 ? this.siblings[i - 1] : null;
    }
    get nextSibling() {
        const i = this.siblings.findIndex((node) => node.unique === this.unique);
        return i <= this.siblings.length - 2 ? this.siblings[i + 1] : null;
    }
    getElementsByTagName(tagName) {
        return this.childElements.reduce((matches, node) => {
            return matches.concat(node.is(tagName) ? [node] : [], node.getElementsByTagName(tagName));
        }, []);
    }
    querySelector(selector) {
        const it = this.querySelectorImpl(selector);
        return it.next().value || null;
    }
    querySelectorAll(selector) {
        const it = this.querySelectorImpl(selector);
        const unique = new Set(it);
        return Array.from(unique.values());
    }
    *querySelectorImpl(selectorList) {
        if (!selectorList) {
            return;
        }
        for (const selector of selectorList.split(/,\s*/)) {
            const pattern = new selector_1.Selector(selector);
            yield* pattern.match(this);
        }
    }
    /**
     * Visit all nodes from this node and down. Depth first.
     */
    visitDepthFirst(callback) {
        function visit(node) {
            node.childElements.forEach(visit);
            if (!node.isRootElement()) {
                callback(node);
            }
        }
        visit(this);
    }
    /**
     * Evaluates callbackk on all descendants, returning true if any are true.
     */
    someChildren(callback) {
        return this.childElements.some(visit);
        function visit(node) {
            if (callback(node)) {
                return true;
            }
            else {
                return node.childElements.some(visit);
            }
        }
    }
    /**
     * Evaluates callbackk on all descendants, returning true if all are true.
     */
    everyChildren(callback) {
        return this.childElements.every(visit);
        function visit(node) {
            if (!callback(node)) {
                return false;
            }
            return node.childElements.every(visit);
        }
    }
    /**
     * Visit all nodes from this node and down. Breadth first.
     *
     * The first node for which the callback evaluates to true is returned.
     */
    find(callback) {
        function visit(node) {
            if (callback(node)) {
                return node;
            }
            for (const child of node.childElements) {
                const match = child.find(callback);
                if (match) {
                    return match;
                }
            }
            return null;
        }
        return visit(this);
    }
}
exports.HtmlElement = HtmlElement;
function isClosed(endToken, meta) {
    let closed = NodeClosed.Open;
    if (meta && meta.void) {
        closed = NodeClosed.VoidOmitted;
    }
    if (endToken.data[0] === "/>") {
        closed = NodeClosed.VoidSelfClosed;
    }
    return closed;
}
