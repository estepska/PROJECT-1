"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventFormatter = exports.eventReplacer = void 0;
const jsonFiltered = ["parent", "children", "meta"];
function eventReplacer(key, value) {
    if (value && key === "location") {
        return `${value.filename}:${value.line}:${value.column}`;
    }
    return jsonFiltered.indexOf(key) >= 0 ? "[truncated]" : value;
}
exports.eventReplacer = eventReplacer;
function eventFormatter(entry) {
    const strdata = JSON.stringify(entry.data, eventReplacer, 2);
    return `${entry.event}: ${strdata}`;
}
exports.eventFormatter = eventFormatter;
