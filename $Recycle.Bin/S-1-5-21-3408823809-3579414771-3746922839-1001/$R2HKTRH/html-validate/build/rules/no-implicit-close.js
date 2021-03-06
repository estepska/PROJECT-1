"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("../dom");
const rule_1 = require("../rule");
class NoImplicitClose extends rule_1.Rule {
    documentation() {
        return {
            description: `Some elements in HTML has optional end tags. When an optional tag is omitted a browser must handle it as if the end tag was present.

Omitted end tags can be ambigious for humans to read and many editors have trouble formatting the markup.`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("tag:close", (event) => {
            const closed = event.previous;
            const by = event.target;
            if (closed.closed !== dom_1.NodeClosed.ImplicitClosed) {
                return;
            }
            const closedByParent = closed.parent.tagName === by.tagName; /* <ul><li></ul> */
            const sameTag = closed.tagName === by.tagName; /* <p>foo<p>bar */
            if (closedByParent) {
                this.report(closed, `Element <${closed.tagName}> is implicitly closed by parent </${by.tagName}>`, closed.location);
            }
            else if (sameTag) {
                this.report(closed, `Element <${closed.tagName}> is implicitly closed by sibling`, closed.location);
            }
            else {
                this.report(closed, `Element <${closed.tagName}> is implicitly closed by adjacent <${by.tagName}>`, closed.location);
            }
        });
    }
}
exports.default = NoImplicitClose;
