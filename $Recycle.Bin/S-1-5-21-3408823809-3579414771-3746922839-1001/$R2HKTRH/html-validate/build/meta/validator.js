"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const dom_1 = require("../dom");
const allowedKeys = ["exclude"];
/**
 * Helper class to validate elements against metadata rules.
 */
class Validator {
    /**
     * Test if element is used in a proper context.
     *
     * @param node - Element to test.
     * @param rules - List of rules.
     * @returns `true` if element passes all tests.
     */
    static validatePermitted(node, rules) {
        if (!rules) {
            return true;
        }
        return rules.some((rule) => {
            return Validator.validatePermittedRule(node, rule);
        });
    }
    /**
     * Test if an element is used the correct amount of times.
     *
     * For instance, a `<table>` element can only contain a single `<tbody>`
     * child. If multiple `<tbody>` exists this test will fail both nodes.
     *
     * @param node - Element to test.
     * @param rules - List of rules.
     * @param numSiblings - How many siblings of the same type as the element
     * exists (including the element itself)
     * @returns `true` if the element passes the test.
     */
    static validateOccurrences(node, rules, numSiblings) {
        if (!rules) {
            return true;
        }
        const category = rules.find((cur) => {
            /** @todo handle complex rules and not just plain arrays (but as of now
             * there is no use-case for it) */
            // istanbul ignore next
            if (typeof cur !== "string") {
                return false;
            }
            const match = cur.match(/^(.*?)[?*]?$/);
            return match && match[1] === node.tagName;
        });
        const limit = parseAmountQualifier(category);
        return limit === null || numSiblings <= limit;
    }
    /**
     * Validate elements order.
     *
     * Given a parent element with children and metadata containing permitted
     * order it will validate each children and ensure each one exists in the
     * specified order.
     *
     * For instance, for a `<table>` element the `<caption>` element must come
     * before a `<thead>` which must come before `<tbody>`.
     *
     * @param children - Array of children to validate.
     */
    static validateOrder(children, rules, cb) {
        if (!rules) {
            return true;
        }
        let i = 0;
        let prev = null;
        for (const node of children) {
            const old = i;
            while (rules[i] && !Validator.validatePermittedCategory(node, rules[i])) {
                i++;
            }
            if (i >= rules.length) {
                /* Second check is if the order is specified for this element at all. It
                 * will be unspecified in two cases:
                 * - disallowed elements
                 * - elements where the order doesn't matter
                 * In both of these cases no error should be reported. */
                const orderSpecified = rules.find((cur) => Validator.validatePermittedCategory(node, cur));
                if (orderSpecified) {
                    cb(node, prev);
                    return false;
                }
                /* if this element has unspecified order the index is restored so new
                 * elements of the same type can be specified again */
                i = old;
            }
            prev = node;
        }
        return true;
    }
    /**
     * Validate element ancestors.
     *
     * Check if an element has the required set of elements. At least one of the
     * selectors must match.
     */
    static validateAncestors(node, rules) {
        if (!rules || rules.length === 0) {
            return true;
        }
        return rules.some((rule) => node.closest(rule));
    }
    /**
     * Validate element required content.
     *
     * Check if an element has the required set of elements. At least one of the
     * selectors must match.
     *
     * Returns [] when valid or a list of tagNames missing as content.
     */
    static validateRequiredContent(node, rules) {
        if (!rules || rules.length === 0) {
            return [];
        }
        return rules.filter((tagName) => {
            const haveMatchingChild = node.childElements.some((child) => child.is(tagName));
            return !haveMatchingChild;
        });
    }
    /**
     * Test if an attribute has an allowed value and/or format.
     *
     * @param attr - Attribute to test.
     * @param rules - Element attribute metadta.
     * @returns `true` if attribute passes all tests.
     */
    static validateAttribute(attr, rules) {
        const rule = rules[attr.key];
        if (!rule) {
            return true;
        }
        /* consider dynamic values as valid as there is no way to properly test them
         * while using transformed sources, i.e. it must be tested when running in a
         * browser instead */
        const value = attr.value;
        if (value instanceof dom_1.DynamicValue) {
            return true;
        }
        const empty = value === null || value === "";
        /* consider an empty array as being a boolean attribute */
        if (rule.length === 0) {
            return empty || value === attr.key;
        }
        /* if the empty string is present allow both "" and null
         * (boolean-attribute-style will regulate which is allowed) */
        if (rule.includes("") && empty) {
            return true;
        }
        if (value === null || value === undefined) {
            return false;
        }
        return rule.some((entry) => {
            if (entry instanceof RegExp) {
                return !!value.match(entry);
            }
            else {
                return value === entry;
            }
        });
    }
    static validatePermittedRule(node, rule) {
        if (typeof rule === "string") {
            return Validator.validatePermittedCategory(node, rule);
        }
        else if (Array.isArray(rule)) {
            return rule.every((inner) => {
                return Validator.validatePermittedRule(node, inner);
            });
        }
        else {
            validateKeys(rule);
            if (rule.exclude) {
                if (Array.isArray(rule.exclude)) {
                    return !rule.exclude.some((inner) => {
                        return Validator.validatePermittedRule(node, inner);
                    });
                }
                else {
                    return !Validator.validatePermittedRule(node, rule.exclude);
                }
            }
            else {
                return true;
            }
        }
    }
    /**
     * Validate node against a content category.
     *
     * When matching parent nodes against permitted parents use the superset
     * parameter to also match for @flow. E.g. if a node expects a @phrasing
     * parent it should also allow @flow parent since @phrasing is a subset of
     * @flow.
     *
     * @param {HtmlElement} node - The node to test against
     * @param {string} category - Name of category with '@' prefix or tag name.
     */
    // eslint-disable-next-line complexity
    static validatePermittedCategory(node, category) {
        /* match tagName when an explicit name is given */
        if (category[0] !== "@") {
            const [, tagName] = category.match(/^(.*?)[?*]?$/);
            return node.tagName === tagName;
        }
        /* if the meta entry is missing assume any content model would match */
        if (!node.meta) {
            return true;
        }
        switch (category) {
            case "@meta":
                return node.meta.metadata;
            case "@flow":
                return node.meta.flow;
            case "@sectioning":
                return node.meta.sectioning;
            case "@heading":
                return node.meta.heading;
            case "@phrasing":
                return node.meta.phrasing;
            case "@embedded":
                return node.meta.embedded;
            case "@interactive":
                return node.meta.interactive;
            case "@script":
                return node.meta.scriptSupporting;
            case "@form":
                return node.meta.form;
            default:
                throw new Error(`Invalid content category "${category}"`);
        }
    }
}
exports.Validator = Validator;
function validateKeys(rule) {
    for (const key of Object.keys(rule)) {
        if (allowedKeys.indexOf(key) === -1) {
            const str = JSON.stringify(rule);
            throw new Error(`Permitted rule "${str}" contains unknown property "${key}"`);
        }
    }
}
function parseAmountQualifier(category) {
    if (!category) {
        /* content not allowed, catched by another rule so just assume unlimited
         * usage for this purpose */
        return null;
    }
    const [, qualifier] = category.match(/^.*?([?*]?)$/);
    switch (qualifier) {
        case "?":
            return 1;
        case "":
            return null;
        case "*":
            return null;
        /* istanbul ignore next */
        default:
            throw new Error(`Invalid amount qualifier "${qualifier}" used`);
    }
}
