"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSeverity = exports.Severity = void 0;
var Severity;
(function (Severity) {
    Severity[Severity["DISABLED"] = 0] = "DISABLED";
    Severity[Severity["WARN"] = 1] = "WARN";
    Severity[Severity["ERROR"] = 2] = "ERROR";
})(Severity = exports.Severity || (exports.Severity = {}));
function parseSeverity(value) {
    switch (value) {
        case 0:
        case "off":
            return Severity.DISABLED;
        /* istanbul ignore next: deprecated code which will be removed later */
        case "disable":
            // eslint-disable-next-line no-console
            console.warn(`Deprecated alias "disabled" will be removed, replace with severity "off"`);
            return Severity.DISABLED;
        case 1:
        case "warn":
            return Severity.WARN;
        case 2:
        case "error":
            return Severity.ERROR;
        default:
            throw new Error(`Invalid severity "${value}"`);
    }
}
exports.parseSeverity = parseSeverity;
