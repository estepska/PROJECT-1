"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_1 = require("../meta");
const rule_1 = require("../rule");
class AttributeAllowedValues extends rule_1.Rule {
    documentation(context) {
        const docs = {
            description: "Attribute has invalid value.",
            url: rule_1.ruleDocumentationUrl(__filename),
        };
        if (!context) {
            return docs;
        }
        if (context.allowed.length > 0) {
            const allowed = context.allowed.map((val) => `- \`${val}\``);
            docs.description = `Element <${context.element}> does not allow attribute \`${context.attribute}\` to have the value \`"${context.value}"\`, it must match one of the following:\n\n${allowed.join("\n")}`;
        }
        else {
            docs.description = `Element <${context.element}> attribute \`${context.attribute}\` must be a boolean attribute, e.g. \`<${context.element} ${context.attribute}>\``;
        }
        return docs;
    }
    setup() {
        this.on("dom:ready", (event) => {
            const doc = event.document;
            doc.visitDepthFirst((node) => {
                const meta = node.meta;
                /* ignore rule if element has no meta or meta does not specify attribute
                 * allowed values */
                if (!meta || !meta.attributes)
                    return;
                for (const attr of node.attributes) {
                    if (meta_1.Validator.validateAttribute(attr, meta.attributes)) {
                        continue;
                    }
                    const value = attr.value ? attr.value.toString() : "";
                    const context = {
                        element: node.tagName,
                        attribute: attr.key,
                        value,
                        allowed: meta.attributes[attr.key],
                    };
                    const message = this.getMessage(attr);
                    const location = this.getLocation(attr);
                    this.report(node, message, location, context);
                }
            });
        });
    }
    getMessage(attr) {
        const { key, value } = attr;
        if (value !== null) {
            return `Attribute "${key}" has invalid value "${value.toString()}"`;
        }
        else {
            return `Attribute "${key}" is missing value`;
        }
    }
    getLocation(attr) {
        if (attr.value !== null) {
            return attr.valueLocation;
        }
        else {
            return attr.keyLocation;
        }
    }
}
exports.default = AttributeAllowedValues;
