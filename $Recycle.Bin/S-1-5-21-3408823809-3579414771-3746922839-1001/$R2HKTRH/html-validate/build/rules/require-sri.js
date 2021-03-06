"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
const defaults = {
    target: "all",
};
const crossorigin = new RegExp("^(\\w+://|//)"); /* e.g. https:// or // */
const supportSri = {
    link: "href",
    script: "src",
};
class RequireSri extends rule_1.Rule {
    constructor(options) {
        super(Object.assign({}, defaults, options));
        this.target = this.options.target;
    }
    documentation() {
        return {
            description: `Subresource Integrity (SRI) \`integrity\` attribute is required to prevent manipulation from Content Delivery Networks or other third-party hosting.`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("tag:close", (event) => {
            /* only handle thats supporting and requires sri */
            const node = event.previous;
            if (!(this.supportSri(node) && this.needSri(node)))
                return;
            /* check if sri attribute is present */
            if (node.hasAttribute("integrity"))
                return;
            this.report(node, `SRI "integrity" attribute is required on <${node.tagName}> element`, node.location);
        });
    }
    supportSri(node) {
        return Object.keys(supportSri).includes(node.tagName);
    }
    needSri(node) {
        if (this.target === "all")
            return true;
        const attr = this.elementSourceAttr(node);
        if (!attr || attr.value === null || attr.isDynamic) {
            return false;
        }
        const url = attr.value.toString();
        return crossorigin.test(url);
    }
    elementSourceAttr(node) {
        const key = supportSri[node.tagName];
        return node.getAttribute(key);
    }
}
exports.default = RequireSri;
