"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAttribute = void 0;
const dom_1 = require("../../dom");
function* processAttribute(attr) {
    /* handle foo="{{ bar }}" as "foo" with a dynamic value (interpolated) */
    if (typeof attr.value === "string" && attr.value.match(/{{.*}}/)) {
        yield Object.assign({}, attr, {
            value: new dom_1.DynamicValue(attr.value),
        });
        return;
    }
    /* passthru original attribute */
    yield attr;
    /* handle "dynamic-foo" as alias for "foo" with dynamic value */
    if (attr.key.startsWith("dynamic-")) {
        yield Object.assign({}, attr, {
            key: attr.key.replace("dynamic-", ""),
            value: new dom_1.DynamicValue(attr.value),
            originalAttribute: attr.key,
        });
    }
}
exports.processAttribute = processAttribute;
