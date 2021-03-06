"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_1 = require("../meta");
const rule_1 = require("../rule");
class ElementPermittedOccurrences extends rule_1.Rule {
    documentation() {
        return {
            description: "Some elements may only be used a fixed amount of times in given context.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("dom:ready", (event) => {
            const doc = event.document;
            doc.visitDepthFirst((node) => {
                const parent = node.parent;
                if (!parent.meta) {
                    return;
                }
                const rules = parent.meta.permittedContent;
                const siblings = parent.childElements.filter((cur) => cur.tagName === node.tagName);
                const first = node.unique === siblings[0].unique;
                /* the first occurrence should not trigger any errors, only the
                 * subsequent occurrences should. */
                if (first) {
                    return;
                }
                if (parent.meta &&
                    !meta_1.Validator.validateOccurrences(node, rules, siblings.length)) {
                    this.report(node, `Element <${node.tagName}> can only appear once under ${parent.annotatedName}`);
                }
            });
        });
    }
}
exports.default = ElementPermittedOccurrences;
