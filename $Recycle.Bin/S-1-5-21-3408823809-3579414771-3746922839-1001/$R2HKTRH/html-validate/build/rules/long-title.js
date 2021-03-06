"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
const defaults = {
    maxlength: 70,
};
class LongTitle extends rule_1.Rule {
    constructor(options) {
        super(Object.assign({}, defaults, options));
        this.maxlength = this.options.maxlength;
    }
    documentation() {
        return {
            description: `Search engines truncates titles with long text, possibly down-ranking the page in the process.`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("tag:close", (event) => {
            const node = event.previous;
            if (node.tagName !== "title")
                return;
            const text = node.textContent;
            if (text.length > this.maxlength) {
                this.report(node, `title text cannot be longer than ${this.maxlength} characters`);
            }
        });
    }
}
exports.default = LongTitle;
