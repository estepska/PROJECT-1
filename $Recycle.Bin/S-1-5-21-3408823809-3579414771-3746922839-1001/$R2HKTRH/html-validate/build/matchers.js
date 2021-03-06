"use strict";
/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/ban-ts-ignore, prefer-template, sonarjs/no-duplicate-string */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jest_diff_1 = __importDefault(require("jest-diff"));
const deepmerge_1 = __importDefault(require("deepmerge"));
const lexer_1 = require("./lexer");
const htmlvalidate_1 = __importDefault(require("./htmlvalidate"));
/**
 * Takes all messages from all files and flattens to a single array.
 */
function flattenMessages(report) {
    return report.results.reduce((aggregated, result) => {
        return aggregated.concat(result.messages);
    }, []);
}
function toBeValid(report) {
    if (report.valid) {
        return {
            pass: true,
            message: /* istanbul ignore next */ () => "Result should not contain error",
        };
    }
    else {
        const firstError = report.results[0].messages[0];
        return {
            pass: false,
            message: () => `Result should be successful but had error "${firstError.message}"`,
        };
    }
}
function toBeInvalid(report) {
    if (report.valid) {
        return {
            pass: false,
            message: () => "Result should be invalid but had no errors",
        };
    }
    else {
        return {
            pass: true,
            message: /* istanbul ignore next */ () => "Result should not contain error",
        };
    }
}
function toHaveError(report, ruleId, message, context) {
    const actual = flattenMessages(report);
    const expected = { ruleId, message };
    if (context) {
        expected.context = context;
    }
    const matcher = [expect.objectContaining(expected)];
    const pass = this.equals(actual, matcher);
    const diffString = jest_diff_1.default(matcher, actual, { expand: this.expand });
    const resultMessage = () => this.utils.matcherHint(".toHaveError") +
        "\n\n" +
        "Expected token to equal:\n" +
        `  ${this.utils.printExpected(matcher)}\n` +
        "Received:\n" +
        `  ${this.utils.printReceived(actual)}` +
        /* istanbul ignore next */ (diffString
            ? `\n\nDifference:\n\n${diffString}`
            : "");
    return { pass, message: resultMessage };
}
function toHaveErrors(report, errors) {
    const actual = flattenMessages(report);
    const matcher = errors.map((entry) => {
        if (Array.isArray(entry)) {
            const [ruleId, message] = entry;
            return expect.objectContaining({ ruleId, message });
        }
        else {
            return expect.objectContaining(entry);
        }
    });
    const pass = this.equals(actual, matcher);
    const diffString = jest_diff_1.default(matcher, actual, { expand: this.expand });
    const resultMessage = () => this.utils.matcherHint(".toHaveErrors") +
        "\n\n" +
        "Expected token to equal:\n" +
        `  ${this.utils.printExpected(matcher)}\n` +
        "Received:\n" +
        `  ${this.utils.printReceived(actual)}` +
        /* istanbul ignore next */ (diffString
            ? `\n\nDifference:\n\n${diffString}`
            : "");
    return { pass, message: resultMessage };
}
function toHTMLValidate(
// @ts-ignore DOM library not available
actual, userConfig, filename) {
    // @ts-ignore DOM library not available
    if (actual instanceof HTMLElement) {
        actual = actual.outerHTML;
    }
    const defaultConfig = {
        rules: {
            /* jsdom normalizes style so disabling rule when using this matcher or it
             * gets quite noisy when configured with self-closing */
            "void-style": "off",
        },
    };
    const config = deepmerge_1.default(defaultConfig, userConfig || {});
    const actualFilename = filename || this.testPath;
    const htmlvalidate = new htmlvalidate_1.default();
    const report = htmlvalidate.validateString(actual, actualFilename, config);
    const pass = report.valid;
    if (pass) {
        return { pass, message: () => "HTML is valid when an error was expected" };
    }
    else {
        const errors = report.results[0].messages.map((message) => `  ${message.message} [${message.ruleId}]`);
        return {
            pass,
            message: () => ["Expected HTML to be valid but had the following errors:", ""]
                .concat(errors)
                .join("\n"),
        };
    }
}
function toBeToken(actual, expected) {
    const token = actual.value;
    // istanbul ignore next: TokenMatcher requires "type" property to be set, this is just a failsafe
    if (token.type) {
        token.type = lexer_1.TokenType[token.type];
    }
    // istanbul ignore next: TokenMatcher requires "type" property to be set, this is just a failsafe
    if (expected.type) {
        expected.type = lexer_1.TokenType[expected.type];
    }
    const matcher = expect.objectContaining(expected);
    const pass = this.equals(token, matcher);
    const diffString = jest_diff_1.default(matcher, token, { expand: this.expand });
    const message = () => this.utils.matcherHint(".toBeToken") +
        "\n\n" +
        "Expected token to equal:\n" +
        `  ${this.utils.printExpected(matcher)}\n` +
        "Received:\n" +
        `  ${this.utils.printReceived(token)}` +
        /* istanbul ignore next */ (diffString
            ? `\n\nDifference:\n\n${diffString}`
            : "");
    return { pass, message };
}
expect.extend({
    toBeValid,
    toBeInvalid,
    toHaveError,
    toHaveErrors,
    toHTMLValidate,
    toBeToken,
});
