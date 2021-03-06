"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
class MissingDoctype extends rule_1.Rule {
    documentation() {
        return {
            description: "Requires that the document contains a doctype.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("dom:ready", (event) => {
            const dom = event.document;
            if (!dom.doctype) {
                this.report(dom.root, "Document is missing doctype");
            }
        });
    }
}
exports.default = MissingDoctype;
