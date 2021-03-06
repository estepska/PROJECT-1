"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attribute = void 0;
const dynamic_value_1 = require("./dynamic-value");
/**
 * DOM Attribute.
 *
 * Represents a HTML attribute. Can contain either a fixed static value or a
 * placeholder for dynamic values (e.g. interpolated).
 */
class Attribute {
    /**
     * @param key - Attribute name.
     * @param value - Attribute value. Set to `null` for boolean attributes.
     * @param keyLocation - Source location of attribute name.
     * @param valueLocation - Source location of attribute value.
     * @param originalAttribute - If this attribute was dynamically added via a
     * transformation (e.g. vuejs `:id` generating the `id` attribute) this
     * parameter should be set to the attribute name of the source attribute (`:id`).
     */
    constructor(key, value, keyLocation, valueLocation, originalAttribute) {
        this.key = key;
        this.value = value;
        this.keyLocation = keyLocation;
        this.valueLocation = valueLocation;
        this.originalAttribute = originalAttribute;
        /* force undefined to null */
        if (typeof this.value === "undefined") {
            this.value = null;
        }
    }
    /**
     * Flag set to true if the attribute value is static.
     */
    get isStatic() {
        return !this.isDynamic;
    }
    /**
     * Flag set to true if the attribute value is dynamic.
     */
    get isDynamic() {
        return this.value instanceof dynamic_value_1.DynamicValue;
    }
    valueMatches(pattern, dynamicMatches = true) {
        /* dynamic values matches everything */
        if (this.value instanceof dynamic_value_1.DynamicValue) {
            return dynamicMatches;
        }
        /* test value against pattern */
        if (pattern instanceof RegExp) {
            return this.value.match(pattern) !== null;
        }
        else {
            return this.value === pattern;
        }
    }
}
exports.Attribute = Attribute;
