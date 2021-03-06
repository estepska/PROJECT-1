"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../../rule");
const helper_1 = require("../helper");
class H36 extends rule_1.Rule {
    documentation() {
        return {
            description: 'WCAG 2.1 requires all images used as submit buttons to have a textual description using the alt attribute. The alt text cannot be empty (`alt=""`).',
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("tag:close", (event) => {
            /* only handle input elements */
            const node = event.previous;
            if (node.tagName !== "input")
                return;
            /* only handle images with type="image" */
            if (node.getAttributeValue("type") !== "image") {
                return;
            }
            if (!helper_1.hasAltText(node)) {
                this.report(node, "image used as submit button must have alt text");
            }
        });
    }
}
exports.default = H36;
