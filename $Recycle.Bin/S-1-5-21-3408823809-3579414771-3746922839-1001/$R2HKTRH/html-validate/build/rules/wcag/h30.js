"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../../rule");
const helper_1 = require("../helper");
const text_1 = require("../helper/text");
class H30 extends rule_1.Rule {
    documentation() {
        return {
            description: "WCAG 2.1 requires each `<a>` anchor link to have a text describing the purpose of the link using either plain text or an `<img>` with the `alt` attribute set.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("dom:ready", (event) => {
            const links = event.document.getElementsByTagName("a");
            for (const link of links) {
                /* check if text content is present (or dynamic) */
                const textClassification = text_1.classifyNodeText(link);
                if (textClassification !== text_1.TextClassification.EMPTY_TEXT) {
                    continue;
                }
                /* check if image with alt-text is present */
                const images = link.querySelectorAll("img");
                if (images.some((image) => helper_1.hasAltText(image))) {
                    continue;
                }
                /* check if aria-label is present on either the <a> element or a descendant */
                const labels = link.querySelectorAll("[aria-label]");
                if (helper_1.hasAriaLabel(link) || labels.some((cur) => helper_1.hasAriaLabel(cur))) {
                    continue;
                }
                this.report(link, "Anchor link must have a text describing its purpose");
            }
        });
    }
}
exports.default = H30;
