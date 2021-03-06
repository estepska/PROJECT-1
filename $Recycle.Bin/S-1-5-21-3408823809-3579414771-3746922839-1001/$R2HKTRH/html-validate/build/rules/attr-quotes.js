"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
var QuoteStyle;
(function (QuoteStyle) {
    QuoteStyle["SINGLE_QUOTE"] = "'";
    QuoteStyle["DOUBLE_QUOTE"] = "\"";
    QuoteStyle["AUTO_QUOTE"] = "auto";
})(QuoteStyle || (QuoteStyle = {}));
const defaults = {
    style: "auto",
    unquoted: false,
};
class AttrQuotes extends rule_1.Rule {
    constructor(options) {
        super(Object.assign({}, defaults, options));
        this.style = parseStyle(this.options.style);
    }
    documentation() {
        if (this.options.style === "auto") {
            return {
                description: `Attribute values are required to be quoted with doublequotes unless the attribute value itself contains doublequotes in which case singlequotes should be used.`,
                url: rule_1.ruleDocumentationUrl(__filename),
            };
        }
        else {
            return {
                description: `Attribute values are required to be quoted with ${this.options.style}quotes.`,
                url: rule_1.ruleDocumentationUrl(__filename),
            };
        }
    }
    setup() {
        this.on("attr", (event) => {
            /* ignore attributes with no value */
            if (typeof event.value === "undefined") {
                return;
            }
            if (typeof event.quote === "undefined") {
                if (this.options.unquoted === false) {
                    this.report(event.target, `Attribute "${event.key}" using unquoted value`);
                }
                return;
            }
            const expected = this.resolveQuotemark(event.value.toString(), this.style);
            if (event.quote !== expected) {
                this.report(event.target, `Attribute "${event.key}" used ${event.quote} instead of expected ${expected}`);
            }
        });
    }
    resolveQuotemark(value, style) {
        if (style === QuoteStyle.AUTO_QUOTE) {
            return value.includes('"') ? "'" : '"';
        }
        else {
            return style;
        }
    }
}
exports.default = AttrQuotes;
function parseStyle(style) {
    switch (style.toLowerCase()) {
        case "auto":
            return QuoteStyle.AUTO_QUOTE;
        case "double":
            return QuoteStyle.DOUBLE_QUOTE;
        case "single":
            return QuoteStyle.SINGLE_QUOTE;
        default:
            return QuoteStyle.DOUBLE_QUOTE;
    }
}
