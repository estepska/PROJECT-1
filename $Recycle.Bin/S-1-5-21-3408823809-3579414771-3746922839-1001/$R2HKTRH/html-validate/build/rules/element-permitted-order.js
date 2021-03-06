"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_1 = require("../meta");
const rule_1 = require("../rule");
class ElementPermittedOrder extends rule_1.Rule {
    documentation() {
        return {
            description: "Some elements has a specific order the children must use.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("dom:ready", (event) => {
            const doc = event.document;
            doc.visitDepthFirst((node) => {
                if (!node.meta) {
                    return;
                }
                const rules = node.meta.permittedOrder;
                meta_1.Validator.validateOrder(node.childElements, rules, (child, prev) => {
                    this.report(child, `Element <${child.tagName}> must be used before <${prev.tagName}> in this context`);
                });
            });
        });
    }
}
exports.default = ElementPermittedOrder;
