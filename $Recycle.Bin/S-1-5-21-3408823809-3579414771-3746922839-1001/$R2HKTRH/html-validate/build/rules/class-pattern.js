"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("../dom");
const pattern_1 = require("../pattern");
const rule_1 = require("../rule");
const defaults = {
    pattern: "kebabcase",
};
class ClassPattern extends rule_1.Rule {
    constructor(options) {
        super(Object.assign({}, defaults, options));
        this.pattern = pattern_1.parsePattern(this.options.pattern);
    }
    documentation() {
        const pattern = pattern_1.describePattern(this.options.pattern);
        return {
            description: `For consistency all classes are required to match the pattern ${pattern}.`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("attr", (event) => {
            if (event.key.toLowerCase() !== "class") {
                return;
            }
            const classes = new dom_1.DOMTokenList(event.value, event.valueLocation);
            classes.forEach((cur, index) => {
                if (!cur.match(this.pattern)) {
                    const location = classes.location(index);
                    this.report(event.target, `Class "${cur}" does not match required pattern "${this.pattern}"`, location);
                }
            });
        });
    }
}
exports.default = ClassPattern;
