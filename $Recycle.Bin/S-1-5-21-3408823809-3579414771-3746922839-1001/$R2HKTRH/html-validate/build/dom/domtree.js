"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMTree = void 0;
const htmlelement_1 = require("./htmlelement");
class DOMTree {
    constructor(location) {
        this.root = htmlelement_1.HtmlElement.rootNode(location);
        this.active = this.root;
        this.doctype = null;
    }
    pushActive(node) {
        this.active = node;
    }
    popActive() {
        if (this.active.isRootElement()) {
            /* root element should never be popped, continue as if nothing happened */
            return;
        }
        this.active = this.active.parent || this.root;
    }
    getActive() {
        return this.active;
    }
    /**
     * Resolve dynamic meta expressions.
     */
    resolveMeta(table) {
        this.visitDepthFirst((node) => table.resolve(node));
    }
    getElementsByTagName(tagName) {
        return this.root.getElementsByTagName(tagName);
    }
    visitDepthFirst(callback) {
        this.root.visitDepthFirst(callback);
    }
    find(callback) {
        return this.root.find(callback);
    }
    querySelector(selector) {
        return this.root.querySelector(selector);
    }
    querySelectorAll(selector) {
        return this.root.querySelectorAll(selector);
    }
}
exports.DOMTree = DOMTree;
