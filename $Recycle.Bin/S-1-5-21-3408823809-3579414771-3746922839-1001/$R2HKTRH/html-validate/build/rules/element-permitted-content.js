"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_1 = require("../meta");
const rule_1 = require("../rule");
class ElementPermittedContent extends rule_1.Rule {
    documentation() {
        return {
            description: "Some elements has restrictions on what content is allowed. This can include both direct children or descendant elements.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("dom:ready", (event) => {
            const doc = event.document;
            doc.visitDepthFirst((node) => {
                /* dont verify root element, assume any element is allowed */
                if (node.parent.isRootElement()) {
                    return;
                }
                /* if parent doesn't have metadata (unknown element) skip checking permitted
                 * content */
                if (!node.parent.meta) {
                    return;
                }
                const parent = node.parent;
                const rules = parent.meta.permittedContent;
                /* Run each validation step, stop as soon as any errors are
                 * reported. This is to prevent multiple similar errors on the same
                 * element, such as "<dd> is not permitted content under <span>" and
                 * "<dd> has no permitted ancestors". */
                [
                    () => this.validatePermittedContent(node, parent, rules),
                    () => this.validatePermittedDescendant(node, parent),
                    () => this.validatePermittedAncestors(node),
                ].some((fn) => fn());
            });
        });
    }
    validatePermittedContent(cur, parent, rules) {
        if (!meta_1.Validator.validatePermitted(cur, rules)) {
            this.report(cur, `Element <${cur.tagName}> is not permitted as content in ${parent.annotatedName}`);
            return true;
        }
        /* for transparent elements all of the children must be validated against
         * the (this elements) parent, i.e. if this node was removed from the DOM it
         * should still be valid. */
        if (cur.meta && cur.meta.transparent) {
            return cur.childElements
                .map((child) => {
                return this.validatePermittedContent(child, parent, rules);
            })
                .some(Boolean);
        }
        return false;
    }
    validatePermittedDescendant(node, parent) {
        while (!parent.isRootElement()) {
            if (parent.meta &&
                node.meta &&
                !meta_1.Validator.validatePermitted(node, parent.meta.permittedDescendants)) {
                this.report(node, `Element <${node.tagName}> is not permitted as descendant of ${parent.annotatedName}`);
                return true;
            }
            parent = parent.parent;
        }
        return false;
    }
    validatePermittedAncestors(node) {
        if (!node.meta) {
            return false;
        }
        const rules = node.meta.requiredAncestors;
        if (!meta_1.Validator.validateAncestors(node, rules)) {
            this.report(node, `Element <${node.tagName}> requires an "${rules[0]}" ancestor`);
            return true;
        }
        return false;
    }
}
exports.default = ElementPermittedContent;
