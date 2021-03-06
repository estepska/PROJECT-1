import { TokenType } from "./lexer";
import { ConfigData } from "./config";
interface TokenMatcher {
    type: TokenType;
    location?: any;
    data?: any;
}
declare global {
    namespace jest {
        interface Matchers<R, T = {}> {
            toBeValid(): R;
            toBeInvalid(): R;
            toBeToken(expected: TokenMatcher): R;
            toHaveError(ruleId: string, message: string, context?: any): R;
            toHaveErrors(errors: Array<[string, string] | {}>): R;
            /**
             * Validate string or HTMLElement.
             *
             * Test passes if result is valid.
             *
             * @param config - Optional HTML-Validate configuration object.
             */
            toHTMLValidate(config?: ConfigData): R;
        }
    }
}
export {};
