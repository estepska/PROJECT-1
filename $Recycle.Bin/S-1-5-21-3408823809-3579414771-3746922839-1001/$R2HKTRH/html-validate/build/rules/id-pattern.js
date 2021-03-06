"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("../dom");
const pattern_1 = require("../pattern");
const rule_1 = require("../rule");
const defaults = {
    pattern: "kebabcase",
};
class IdPattern extends rule_1.Rule {
    constructor(options) {
        super(Object.assign({}, defaults, options));
        this.pattern = pattern_1.parsePattern(this.options.pattern);
    }
    documentation() {
        const pattern = pattern_1.describePattern(this.options.pattern);
        return {
            description: `For consistency all IDs are required to match the pattern ${pattern}.`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("attr", (event) => {
            if (event.key.toLowerCase() !== "id") {
                return;
            }
            /* consider dynamic value as always matching the pattern */
            if (event.value instanceof dom_1.DynamicValue) {
                return;
            }
            if (!event.value.match(this.pattern)) {
                this.report(event.target, `ID "${event.value}" does not match required pattern "${this.pattern}"`, event.valueLocation);
            }
        });
    }
}
exports.default = IdPattern;
