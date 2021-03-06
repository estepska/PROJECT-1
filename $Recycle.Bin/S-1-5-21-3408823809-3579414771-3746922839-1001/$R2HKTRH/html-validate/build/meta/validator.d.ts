import { Attribute, HtmlElement } from "../dom";
import { Permitted, PermittedAttribute, PermittedOrder, RequiredAncestors, RequiredContent } from "./element";
/**
 * Helper class to validate elements against metadata rules.
 */
export declare class Validator {
    /**
     * Test if element is used in a proper context.
     *
     * @param node - Element to test.
     * @param rules - List of rules.
     * @returns `true` if element passes all tests.
     */
    static validatePermitted(node: HtmlElement, rules: Permitted | null): boolean;
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
    static validateOccurrences(node: HtmlElement, rules: Permitted | null, numSiblings: number): boolean;
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
    static validateOrder(children: HtmlElement[], rules: PermittedOrder | null, cb: (node: HtmlElement, prev: HtmlElement) => void): boolean;
    /**
     * Validate element ancestors.
     *
     * Check if an element has the required set of elements. At least one of the
     * selectors must match.
     */
    static validateAncestors(node: HtmlElement, rules: RequiredAncestors | null): boolean;
    /**
     * Validate element required content.
     *
     * Check if an element has the required set of elements. At least one of the
     * selectors must match.
     *
     * Returns [] when valid or a list of tagNames missing as content.
     */
    static validateRequiredContent(node: HtmlElement, rules: RequiredContent | null): string[];
    /**
     * Test if an attribute has an allowed value and/or format.
     *
     * @param attr - Attribute to test.
     * @param rules - Element attribute metadta.
     * @returns `true` if attribute passes all tests.
     */
    static validateAttribute(attr: Attribute, rules: PermittedAttribute): boolean;
    private static validatePermittedRule;
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
    private static validatePermittedCategory;
}
