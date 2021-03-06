"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaValidationError = void 0;
const better_ajv_errors_1 = __importDefault(require("@sidvind/better-ajv-errors"));
const user_error_1 = require("./user-error");
function getSummary(schema, obj, errors) {
    const output = better_ajv_errors_1.default(schema, obj, errors, {
        format: "js",
    });
    // istanbul ignore next: for safety only
    return output.length > 0 ? output[0].error : "unknown validation error";
}
class SchemaValidationError extends user_error_1.UserError {
    constructor(filename, message, obj, schema, errors) {
        const summary = getSummary(schema, obj, errors);
        super(`${message}: ${summary}`);
        this.filename = filename;
        this.obj = obj;
        this.schema = schema;
        this.errors = errors;
    }
    prettyError() {
        return better_ajv_errors_1.default(this.schema, this.obj, this.errors, {
            format: "cli",
            indent: 2,
        });
    }
}
exports.SchemaValidationError = SchemaValidationError;
