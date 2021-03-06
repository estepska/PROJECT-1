"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
const defaults = {
    style: "omit",
};
class AttributeBooleanStyle extends rule_1.Rule {
    constructor(options) {
        super(Object.assign({}, defaults, options));
        this.hasInvalidStyle = parseStyle(this.options.style);
    }
    documentation() {
        return {
            description: "Require a specific style when writing boolean attributes.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("dom:ready", (event) => {
            const doc = event.document;
            doc.visitDepthFirst((node) => {
                const meta = node.meta;
                /* ignore rule if element has no meta or meta does not specify attribute
                 * allowed values */
                if (!meta || !meta.attributes)
                    return;
                /* check all boolean attributes */
                for (const attr of node.attributes) {
                    if (!this.isBoolean(attr, meta.attributes))
                        continue;
                    /* ignore attribute if it is aliased by a dynamic value,
                     * e.g. ng-required or v-bind:required, since it will probably have a
                     * value despite the target attribute is a boolean. The framework is
                     * assumed to handle it properly */
                    if (attr.originalAttribute) {
                        continue;
                    }
                    if (this.hasInvalidStyle(attr)) {
                        this.report(node, reportMessage(attr, this.options.style), attr.keyLocation);
                    }
                }
            });
        });
    }
    isBoolean(attr, rules) {
        return rules[attr.key] && rules[attr.key].length === 0;
    }
}
exports.default = AttributeBooleanStyle;
function parseStyle(style) {
    switch (style.toLowerCase()) {
        case "omit":
            return (attr) => attr.value !== null;
        case "empty":
            return (attr) => attr.value !== "";
        case "name":
            return (attr) => attr.value !== attr.key;
        default:
            throw new Error(`Invalid style "${style}" for "attribute-boolean-style" rule`);
    }
}
function reportMessage(attr, style) {
    const key = attr.key;
    switch (style.toLowerCase()) {
        case "omit":
            return `Attribute "${key}" should omit value`;
        case "empty":
            return `Attribute "${key}" value should be empty string`;
        case "name":
            return `Attribute "${key}" should be set to ${key}="${key}"`;
    }
    /* istanbul ignore next: the above switch should cover all cases */
    return "";
}
