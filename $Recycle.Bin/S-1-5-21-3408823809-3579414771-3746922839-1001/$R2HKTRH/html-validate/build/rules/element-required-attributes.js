"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
class ElementRequiredAttributes extends rule_1.Rule {
    documentation(context) {
        const docs = {
            description: "Element is missing a required attribute",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
        if (context) {
            docs.description = `The <${context.element}> element is required to have a "${context.attribute}" attribute.`;
        }
        return docs;
    }
    setup() {
        this.on("tag:close", (event) => {
            const node = event.previous;
            const meta = node.meta;
            if (!meta || !meta.requiredAttributes)
                return;
            for (const key of meta.requiredAttributes) {
                if (node.hasAttribute(key))
                    continue;
                const context = {
                    element: node.tagName,
                    attribute: key,
                };
                this.report(node, `${node.annotatedName} is missing required "${key}" attribute`, node.location, context);
            }
        });
    }
}
exports.default = ElementRequiredAttributes;
