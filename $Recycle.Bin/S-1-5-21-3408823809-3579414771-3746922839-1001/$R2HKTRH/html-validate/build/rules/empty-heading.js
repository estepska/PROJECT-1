"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
const text_1 = require("./helper/text");
const selector = ["h1", "h2", "h3", "h4", "h5", "h6"].join(",");
class EmptyHeading extends rule_1.Rule {
    documentation() {
        return {
            description: `Assistive technology such as screen readers require textual content in headings. Whitespace only is considered empty.`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("dom:ready", ({ document }) => {
            const headings = document.querySelectorAll(selector);
            for (const heading of headings) {
                switch (text_1.classifyNodeText(heading)) {
                    case text_1.TextClassification.DYNAMIC_TEXT:
                    case text_1.TextClassification.STATIC_TEXT:
                        /* have some text content, consider ok */
                        break;
                    case text_1.TextClassification.EMPTY_TEXT:
                        /* no content or whitespace only */
                        this.report(heading, `<${heading.tagName}> cannot be empty, must have text content`);
                        break;
                }
            }
        });
    }
}
exports.default = EmptyHeading;
