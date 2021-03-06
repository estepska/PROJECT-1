"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const entities = {
    ">": "&gt;",
    "<": "&lt;",
    "'": "&apos;",
    '"': "&quot;",
    "&": "&amp;",
};
function xmlescape(src) {
    if (src === null || src === undefined)
        return src;
    return src.toString().replace(/[><'"&]/g, (match) => {
        return entities[match];
    });
}
function getMessageType(message) {
    switch (message.severity) {
        case 2:
            return "error";
        case 1:
            return "warning";
        default:
            return "error";
    }
}
function checkstyleFormatter(results) {
    let output = "";
    output += `<?xml version="1.0" encoding="utf-8"?>`;
    output += `<checkstyle version="4.3">`;
    results.forEach((result) => {
        const messages = result.messages;
        output += `<file name="${xmlescape(result.filePath)}">`;
        messages.forEach((message) => {
            const ruleId = message.ruleId
                ? xmlescape(`htmlvalidate.rules.${message.ruleId}`)
                : "";
            output += [
                `<error line="${xmlescape(message.line)}"`,
                `column="${xmlescape(message.column)}"`,
                `severity="${xmlescape(getMessageType(message))}"`,
                `message="${xmlescape(message.message)}${message.ruleId ? ` (${message.ruleId})` : ""}"`,
                `source="${ruleId}" />`,
            ].join(" ");
        });
        output += "</file>";
    });
    output += "</checkstyle>";
    return output;
}
const formatter = checkstyleFormatter;
exports.default = formatter;
