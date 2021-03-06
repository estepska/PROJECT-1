"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../../rule");
const a17y_1 = require("../helper/a17y");
const defaults = {
    allowEmpty: true,
    alias: [],
};
class H37 extends rule_1.Rule {
    documentation() {
        return {
            description: "Both HTML5 and WCAG 2.0 requires images to have a alternative text for each image.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    constructor(options) {
        super(Object.assign({}, defaults, options));
        /* ensure alias is array */
        if (!Array.isArray(this.options.alias)) {
            this.options.alias = [this.options.alias];
        }
    }
    setup() {
        this.on("tag:close", (event) => {
            const node = event.previous;
            /* only validate images */
            if (!node || node.tagName !== "img") {
                return;
            }
            /* ignore images with aria-hidden="true" or role="presentation" */
            if (!a17y_1.inAccessibilityTree(node)) {
                return;
            }
            /* validate plain alt-attribute */
            const alt = node.getAttributeValue("alt");
            if (alt || (alt === "" && this.options.allowEmpty)) {
                return;
            }
            /* validate if any non-empty alias is present */
            for (const attr of this.options.alias) {
                if (node.getAttribute(attr)) {
                    return;
                }
            }
            this.report(node, '<img> is missing required "alt" attribute', node.location);
        });
    }
}
exports.default = H37;
