"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
class NoConditionalComment extends rule_1.Rule {
    documentation() {
        return {
            description: "Microsoft Internet Explorer previously supported using special HTML comments (conditional comments) for targeting specific versions of IE but since IE 10 it is deprecated and not supported in standards mode.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("conditional", (event) => {
            this.report(null, "Use of conditional comments are deprecated", event.location);
        });
    }
}
exports.default = NoConditionalComment;
