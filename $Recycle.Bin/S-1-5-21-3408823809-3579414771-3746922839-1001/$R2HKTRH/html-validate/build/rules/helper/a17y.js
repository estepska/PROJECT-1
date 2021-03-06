"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inAccessibilityTree = void 0;
/**
 * Tests if this element is present in the accessibility tree.
 *
 * In practice it tests whenever the element or its parents has
 * `role="presentation"` or `aria-hidden="false"`. Dynamic values counts as
 * visible since the element might be in the visibility tree sometimes.
 */
function inAccessibilityTree(node) {
    do {
        const role = node.getAttribute("role");
        const ariaHidden = node.getAttribute("aria-hidden");
        /* role="presentation" */
        if (role && role.value === "presentation") {
            return false;
        }
        /* aria-hidden="true" */
        if (ariaHidden && ariaHidden.value === "true") {
            return false;
        }
        /* check parents */
        node = node.parent;
    } while (!node.isRootElement());
    return true;
}
exports.inAccessibilityTree = inAccessibilityTree;
