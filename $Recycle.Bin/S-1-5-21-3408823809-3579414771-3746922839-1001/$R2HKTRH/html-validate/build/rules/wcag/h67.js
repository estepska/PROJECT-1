"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../../rule");
class H67 extends rule_1.Rule {
    documentation() {
        return {
            description: "A decorative image cannot have a title attribute. Either remove `title` or add a descriptive `alt` text.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("tag:close", (event) => {
            const node = event.target;
            /* only validate images */
            if (!node || node.tagName !== "img") {
                return;
            }
            /* ignore images without title */
            const title = node.getAttribute("title");
            if (!title || title.value === "") {
                return;
            }
            /* ignore elements with non-empty alt-text */
            const alt = node.getAttributeValue("alt");
            if (alt && alt !== "") {
                return;
            }
            this.report(node, "<img> with empty alt text cannot have title attribute", title.keyLocation);
        });
    }
}
exports.default = H67;
