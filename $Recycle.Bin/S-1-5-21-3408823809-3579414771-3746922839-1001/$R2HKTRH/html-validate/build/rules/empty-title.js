"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
const text_1 = require("./helper/text");
class EmptyTitle extends rule_1.Rule {
    documentation() {
        return {
            description: `The <title> element is used to describe the document and is shown in the browser tab and titlebar. WCAG and SEO requires a descriptive title and preferably unique within the site. Whitespace only is considered empty.`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("tag:close", (event) => {
            const node = event.previous;
            if (node.tagName !== "title")
                return;
            switch (text_1.classifyNodeText(node)) {
                case text_1.TextClassification.DYNAMIC_TEXT:
                case text_1.TextClassification.STATIC_TEXT:
                    /* have some text content, consider ok */
                    break;
                case text_1.TextClassification.EMPTY_TEXT:
                    /* no content or whitespace only */
                    this.report(node, `<${node.tagName}> cannot be empty, must have text content`);
                    break;
            }
        });
    }
}
exports.default = EmptyTitle;
