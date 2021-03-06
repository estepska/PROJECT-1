"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
class NoDupAttr extends rule_1.Rule {
    documentation() {
        return {
            description: "HTML disallows two or more attributes with the same (case-insensitive) name.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        let attr = {};
        this.on("tag:open", () => {
            /* reset any time a new tag is opened */
            attr = {};
        });
        this.on("attr", (event) => {
            /* ignore dynamic attributes aliasing another, e.g class and ng-class */
            if (event.originalAttribute) {
                return;
            }
            const name = event.key.toLowerCase();
            if (name in attr) {
                this.report(event.target, `Attribute "${name}" duplicated`);
            }
            attr[event.key] = true;
        });
    }
}
exports.default = NoDupAttr;
