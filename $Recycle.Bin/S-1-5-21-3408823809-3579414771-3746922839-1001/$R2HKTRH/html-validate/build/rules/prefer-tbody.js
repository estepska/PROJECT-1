"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("../rule");
class PreferTbody extends rule_1.Rule {
    documentation() {
        return {
            description: `While \`<tbody>\` is optional is relays semantic information about its contents. Where applicable it should also be combined with \`<thead>\` and \`<tfoot>\`.`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("dom:ready", (event) => {
            const doc = event.document;
            for (const table of doc.querySelectorAll("table")) {
                if (table.querySelector("> tbody")) {
                    continue;
                }
                const tr = table.querySelectorAll("> tr");
                if (tr.length >= 1) {
                    this.report(tr[0], "Prefer to wrap <tr> elements in <tbody>");
                }
            }
        });
    }
}
exports.default = PreferTbody;
