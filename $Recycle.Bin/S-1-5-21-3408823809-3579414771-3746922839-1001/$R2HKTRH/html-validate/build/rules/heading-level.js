"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("../context");
const rule_1 = require("../rule");
class HeadingLevel extends rule_1.Rule {
    documentation() {
        return {
            description: "Validates heading level increments and order. Headings must start at h1 and can only increase one level at a time.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        let current = 0;
        this.on("tag:open", (event) => {
            /* ensure it is a heading */
            if (!this.isHeading(event.target))
                return;
            /* extract heading level from tagName */
            const level = this.extractLevel(event.target);
            if (!level)
                return;
            /* allow same level or decreasing to any level (e.g. from h4 to h2) */
            if (level <= current) {
                current = level;
                return;
            }
            /* validate heading level was only incremented by one */
            const expected = current + 1;
            if (level !== expected) {
                const location = context_1.sliceLocation(event.location, 1);
                if (current > 0) {
                    this.report(event.target, `Heading level can only increase by one, expected h${expected}`, location);
                }
                else {
                    this.report(event.target, `Initial heading level must be h${expected}`, location);
                }
            }
            current = level;
        });
    }
    isHeading(node) {
        return node.meta && !!node.meta.heading;
    }
    extractLevel(node) {
        const match = node.tagName.match(/^[hH](\d)$/);
        return match ? parseInt(match[1], 10) : null;
    }
}
exports.default = HeadingLevel;
