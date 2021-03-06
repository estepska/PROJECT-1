import betterAjvErrors from "@sidvind/better-ajv-errors";
import Ajv from "ajv";
import { UserError } from "./user-error";
export declare class SchemaValidationError extends UserError {
    filename: string | null;
    private obj;
    private schema;
    private errors;
    constructor(filename: string | null, message: string, obj: any, schema: any, errors: Ajv.ErrorObject[]);
    prettyError(): void | betterAjvErrors.IOutputError[];
}
