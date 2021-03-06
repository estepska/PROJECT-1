"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCombinator = exports.Combinator = void 0;
var Combinator;
(function (Combinator) {
    Combinator[Combinator["DESCENDANT"] = 0] = "DESCENDANT";
    Combinator[Combinator["CHILD"] = 1] = "CHILD";
    Combinator[Combinator["ADJACENT_SIBLING"] = 2] = "ADJACENT_SIBLING";
    Combinator[Combinator["GENERAL_SIBLING"] = 3] = "GENERAL_SIBLING";
})(Combinator = exports.Combinator || (exports.Combinator = {}));
function parseCombinator(combinator) {
    switch (combinator) {
        case undefined:
        case null:
        case "":
            return Combinator.DESCENDANT;
        case ">":
            return Combinator.CHILD;
        case "+":
            return Combinator.ADJACENT_SIBLING;
        case "~":
            return Combinator.GENERAL_SIBLING;
        default:
            throw new Error(`Unknown combinator "${combinator}"`);
    }
}
exports.parseCombinator = parseCombinator;
