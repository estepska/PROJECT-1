"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom_1 = require("../dom");
const rule_1 = require("../rule");
var Style;
(function (Style) {
    Style[Style["Any"] = 0] = "Any";
    Style[Style["AlwaysOmit"] = 1] = "AlwaysOmit";
    Style[Style["AlwaysSelfclose"] = 2] = "AlwaysSelfclose";
})(Style || (Style = {}));
const defaults = {
    style: "omit",
};
class Void extends rule_1.Rule {
    constructor(options) {
        super(Object.assign({}, defaults, options));
        this.style = parseStyle(this.options.style);
    }
    get deprecated() {
        return true;
    }
    documentation() {
        return {
            description: "HTML void elements cannot have any content and must not have an end tag.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("tag:close", (event) => {
            const current = event.target; // The current element being closed
            const active = event.previous; // The current active element (that is, the current element on the stack)
            if (current && current.meta) {
                this.validateCurrent(current);
            }
            if (active && active.meta) {
                this.validateActive(active);
            }
        });
    }
    validateCurrent(node) {
        if (node.voidElement && node.closed === dom_1.NodeClosed.EndTag) {
            this.report(null, `End tag for <${node.tagName}> must be omitted`, node.location);
        }
    }
    validateActive(node) {
        /* ignore foreign elements, they may or may not be self-closed and both are
         * valid */
        if (node.meta.foreign) {
            return;
        }
        const selfOrOmitted = node.closed === dom_1.NodeClosed.VoidOmitted ||
            node.closed === dom_1.NodeClosed.VoidSelfClosed;
        if (node.voidElement) {
            if (this.style === Style.AlwaysOmit &&
                node.closed === dom_1.NodeClosed.VoidSelfClosed) {
                this.report(node, `Expected omitted end tag <${node.tagName}> instead of self-closing element <${node.tagName}/>`);
            }
            if (this.style === Style.AlwaysSelfclose &&
                node.closed === dom_1.NodeClosed.VoidOmitted) {
                this.report(node, `Expected self-closing element <${node.tagName}/> instead of omitted end-tag <${node.tagName}>`);
            }
        }
        if (selfOrOmitted && node.voidElement === false) {
            this.report(node, `End tag for <${node.tagName}> must not be omitted`);
        }
    }
}
exports.default = Void;
function parseStyle(name) {
    switch (name) {
        case "any":
            return Style.Any;
        case "omit":
            return Style.AlwaysOmit;
        case "selfclose":
        case "selfclosing":
            return Style.AlwaysSelfclose;
        default:
            throw new Error(`Invalid style "${name}" for "void" rule`);
    }
}
