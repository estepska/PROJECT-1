"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
class NoTrailingWhitespace extends rule_1.Rule {
    documentation() {
        return {
            description: "Lines with trailing whitespace cause unnessecary diff when using version control and usually serve no special purpose in HTML.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("whitespace", (event) => {
            if (event.text.match(/^[ \t]+\n$/)) {
                this.report(undefined, "Trailing whitespace", event.location);
            }
        });
    }
}
exports.default = NoTrailingWhitespace;
