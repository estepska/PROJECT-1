"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("../context");
const dom_1 = require("../dom");
const rule_1 = require("../rule");
const entities = require("../../elements/entities.json");
const regexp = /&([a-z0-9]+|#x?[0-9a-f]+);/gi;
class UnknownCharReference extends rule_1.Rule {
    documentation(context) {
        return {
            description: `HTML defines a set of valid character references but ${context || "this"} is not a valid one.`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("element:ready", (event) => {
            const node = event.target;
            /* only iterate over direct descendants */
            for (const child of node.childNodes) {
                if (child.nodeType !== dom_1.NodeType.TEXT_NODE) {
                    continue;
                }
                this.findCharacterReferences(child.textContent, child.location);
            }
        });
        this.on("attr", (event) => {
            /* boolean attributes has no value so nothing to validate */
            if (!event.value) {
                return;
            }
            this.findCharacterReferences(event.value.toString(), event.valueLocation);
        });
    }
    findCharacterReferences(text, location) {
        let match;
        do {
            match = regexp.exec(text);
            if (match) {
                const entity = match[0];
                /* assume numeric entities are valid for now */
                if (entity.startsWith("&#")) {
                    continue;
                }
                /* ignore if this is a known character reference name */
                if (entities.includes(entity)) {
                    continue;
                }
                const entityLocation = context_1.sliceLocation(location, match.index, match.index + entity.length);
                this.report(null, `Unrecognized character reference "${entity}"`, entityLocation, entity);
            }
        } while (match);
    }
}
exports.default = UnknownCharReference;
