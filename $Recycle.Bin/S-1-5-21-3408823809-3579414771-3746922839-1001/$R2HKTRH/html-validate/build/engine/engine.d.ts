import { Config, Severity } from "../config";
import { Source } from "../context";
import { Parser } from "../parser";
import { Report, Reporter } from "../reporter";
import { Rule, RuleConstructor, RuleDocumentation } from "../rule";
export declare type RuleOptions = Record<string, any>;
export interface EventDump {
    event: string;
    data: any;
}
export interface TokenDump {
    token: string;
    data: string;
    location: string;
}
export declare class Engine<T extends Parser = Parser> {
    protected report: Reporter;
    protected config: Config;
    protected ParserClass: new (config: Config) => T;
    protected availableRules: {
        [key: string]: RuleConstructor<any, any>;
    };
    constructor(config: Config, ParserClass: new (config: Config) => T);
    /**
     * Lint sources and return report
     *
     * @param src {object} - Parse source.
     * @param src.data {string} - Text HTML data.
     * @param src.filename {string} - Filename of source for presentation in report.
     * @return {object} - Report output.
     */
    lint(sources: Source[]): Report;
    dumpEvents(source: Source[]): EventDump[];
    dumpTokens(source: Source[]): TokenDump[];
    dumpTree(source: Source[]): string[];
    /**
     * Get rule documentation.
     */
    getRuleDocumentation(ruleId: string, context?: any): RuleDocumentation;
    /**
     * Create a new parser instance with the current configuration.
     *
     * @hidden
     */
    instantiateParser(): Parser;
    private processDirective;
    private processEnableDirective;
    private processDisableDirective;
    private processDisableBlockDirective;
    private processDisableNextDirective;
    protected initPlugins(config: Config): {
        availableRules: {
            [key: string]: RuleConstructor<any, any>;
        };
    };
    /**
     * Initializes all rules from plugins and returns an object with a mapping
     * between rule name and its constructor.
     */
    protected initRules(config: Config): {
        [key: string]: RuleConstructor<any, any>;
    };
    /**
     * Setup all plugins for this session.
     */
    protected setupPlugins(source: Source, config: Config, parser: Parser): {
        rules: {
            [key: string]: Rule;
        };
    };
    /**
     * Load and setup all rules for current configuration.
     */
    protected setupRules(config: Config, parser: Parser): {
        [key: string]: Rule;
    };
    /**
     * Load and setup a rule using current config.
     */
    protected loadRule(ruleId: string, severity: Severity, options: any, parser: Parser, report: Reporter): Rule;
    protected instantiateRule(name: string, options: RuleOptions): Rule;
    private missingRule;
    private reportError;
}
