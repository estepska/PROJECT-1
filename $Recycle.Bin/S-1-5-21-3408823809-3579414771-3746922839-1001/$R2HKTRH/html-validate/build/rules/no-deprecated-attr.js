"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
class NoDeprecatedAttr extends rule_1.Rule {
    documentation() {
        return {
            description: "HTML5 deprecated many old attributes.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("attr", (event) => {
            const node = event.target;
            const meta = node.meta;
            const attr = event.key.toLowerCase();
            /* cannot validate if meta isn't known */
            if (meta === null) {
                return;
            }
            const deprecated = meta.deprecatedAttributes || [];
            if (deprecated.indexOf(attr) >= 0) {
                this.report(node, `Attribute "${event.key}" is deprecated on <${node.tagName}> element`);
            }
        });
    }
}
exports.default = NoDeprecatedAttr;
