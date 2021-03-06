"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = void 0;
const config_1 = require("../config");
const lexer_1 = require("../lexer");
const parser_1 = require("../parser");
const reporter_1 = require("../reporter");
const rule_1 = require("../rule");
const rules_1 = __importDefault(require("../rules"));
class Engine {
    constructor(config, ParserClass) {
        this.report = new reporter_1.Reporter();
        this.config = config;
        this.ParserClass = ParserClass;
        /* initialize plugins and rules */
        const result = this.initPlugins(this.config);
        this.availableRules = Object.assign(Object.assign({}, rules_1.default), result.availableRules);
    }
    /**
     * Lint sources and return report
     *
     * @param src {object} - Parse source.
     * @param src.data {string} - Text HTML data.
     * @param src.filename {string} - Filename of source for presentation in report.
     * @return {object} - Report output.
     */
    lint(sources) {
        for (const source of sources) {
            /* create parser for source */
            const parser = this.instantiateParser();
            /* setup plugins and rules */
            const { rules } = this.setupPlugins(source, this.config, parser);
            /* trigger configuration ready event */
            const event = {
                location: {
                    filename: source.filename,
                    line: 1,
                    column: 1,
                    offset: 0,
                    size: 1,
                },
                config: this.config.get(),
                rules,
            };
            parser.trigger("config:ready", event);
            /* setup directive handling */
            parser.on("directive", (_, event) => {
                this.processDirective(event, parser, rules);
            });
            /* parse token stream */
            try {
                parser.parseHtml(source);
            }
            catch (e) {
                if (e instanceof lexer_1.InvalidTokenError || e instanceof parser_1.ParserError) {
                    this.reportError("parser-error", e.message, e.location);
                }
                else {
                    throw e;
                }
            }
        }
        /* generate results from report */
        return this.report.save(sources);
    }
    dumpEvents(source) {
        const parser = new parser_1.Parser(this.config);
        const lines = [];
        parser.on("*", (event, data) => {
            lines.push({ event, data });
        });
        source.forEach((src) => parser.parseHtml(src));
        return lines;
    }
    dumpTokens(source) {
        const lexer = new lexer_1.Lexer();
        const lines = [];
        for (const src of source) {
            for (const token of lexer.tokenize(src)) {
                const data = token.data ? token.data[0] : null;
                lines.push({
                    token: lexer_1.TokenType[token.type],
                    data,
                    location: `${token.location.filename}:${token.location.line}:${token.location.column}`,
                });
            }
        }
        return lines;
    }
    dumpTree(source) {
        /* @todo handle dumping each tree */
        const parser = new parser_1.Parser(this.config);
        const dom = parser.parseHtml(source[0]);
        const lines = [];
        function decoration(node) {
            let output = "";
            if (node.hasAttribute("id")) {
                output += `#${node.id}`;
            }
            if (node.hasAttribute("class")) {
                output += `.${node.classList.join(".")}`;
            }
            return output;
        }
        function writeNode(node, level, sibling) {
            if (level > 0) {
                const indent = "  ".repeat(level - 1);
                const l = node.childElements.length > 0 ? "┬" : "─";
                const b = sibling < node.parent.childElements.length - 1 ? "├" : "└";
                lines.push(`${indent}${b}─${l} ${node.tagName}${decoration(node)}`);
            }
            else {
                lines.push("(root)");
            }
            node.childElements.forEach((child, index) => writeNode(child, level + 1, index));
        }
        writeNode(dom.root, 0, 0);
        return lines;
    }
    /**
     * Get rule documentation.
     */
    getRuleDocumentation(ruleId, context) {
        const rules = this.config.getRules();
        if (rules.has(ruleId)) {
            const [, options] = rules.get(ruleId);
            const rule = this.instantiateRule(ruleId, options);
            return rule.documentation(context);
        }
        else {
            return null;
        }
    }
    /**
     * Create a new parser instance with the current configuration.
     *
     * @hidden
     */
    instantiateParser() {
        return new this.ParserClass(this.config);
    }
    processDirective(event, parser, allRules) {
        const rules = event.data
            .split(",")
            .map((name) => name.trim())
            .map((name) => allRules[name])
            .filter((rule) => rule); /* filter out missing rules */
        switch (event.action) {
            case "enable":
                this.processEnableDirective(rules, parser);
                break;
            case "disable":
                this.processDisableDirective(rules, parser);
                break;
            case "disable-block":
                this.processDisableBlockDirective(rules, parser);
                break;
            case "disable-next":
                this.processDisableNextDirective(rules, parser);
                break;
            default:
                this.reportError("parser-error", `Unknown directive "${event.action}"`, event.location);
                break;
        }
    }
    processEnableDirective(rules, parser) {
        for (const rule of rules) {
            rule.setEnabled(true);
            if (rule.getSeverity() === config_1.Severity.DISABLED) {
                rule.setServerity(config_1.Severity.ERROR);
            }
        }
        /* enable rules on node */
        parser.on("tag:open", (event, data) => {
            data.target.enableRules(rules.map((rule) => rule.name));
        });
    }
    processDisableDirective(rules, parser) {
        for (const rule of rules) {
            rule.setEnabled(false);
        }
        /* disable rules on node */
        parser.on("tag:open", (event, data) => {
            data.target.disableRules(rules.map((rule) => rule.name));
        });
    }
    processDisableBlockDirective(rules, parser) {
        let directiveBlock = null;
        for (const rule of rules) {
            rule.setEnabled(false);
        }
        const unregisterOpen = parser.on("tag:open", (event, data) => {
            /* wait for a tag to open and find the current block by using its parent */
            if (directiveBlock === null) {
                directiveBlock = data.target.parent.unique;
            }
            /* disable rules directly on the node so it will be recorded for later,
             * more specifically when using the domtree to trigger errors */
            data.target.disableRules(rules.map((rule) => rule.name));
        });
        const unregisterClose = parser.on("tag:close", (event, data) => {
            /* if the directive is the last thing in a block no id would be set */
            const lastNode = directiveBlock === null;
            /* test if the block is being closed by checking the parent of the block
             * element is being closed */
            const parentClosed = directiveBlock === data.previous.unique;
            /* remove listeners and restore state */
            if (lastNode || parentClosed) {
                unregisterClose();
                unregisterOpen();
                for (const rule of rules) {
                    rule.setEnabled(true);
                }
            }
        });
    }
    processDisableNextDirective(rules, parser) {
        for (const rule of rules) {
            rule.setEnabled(false);
        }
        /* disable rules directly on the node so it will be recorded for later,
         * more specifically when using the domtree to trigger errors */
        const unregister = parser.on("tag:open", (event, data) => {
            data.target.disableRules(rules.map((rule) => rule.name));
        });
        /* disable directive after next event occurs */
        parser.once("tag:open, tag:close, attr", () => {
            unregister();
            parser.defer(() => {
                for (const rule of rules) {
                    rule.setEnabled(true);
                }
            });
        });
    }
    /*
     * Initialize all plugins. This should only be done once for all sessions.
     */
    initPlugins(config) {
        for (const plugin of config.getPlugins()) {
            if (plugin.init) {
                plugin.init();
            }
        }
        return {
            availableRules: this.initRules(config),
        };
    }
    /**
     * Initializes all rules from plugins and returns an object with a mapping
     * between rule name and its constructor.
     */
    initRules(config) {
        const availableRules = {};
        for (const plugin of config.getPlugins()) {
            for (const [name, rule] of Object.entries(plugin.rules || {})) {
                availableRules[name] = rule;
            }
        }
        return availableRules;
    }
    /**
     * Setup all plugins for this session.
     */
    setupPlugins(source, config, parser) {
        const eventHandler = parser.getEventHandler();
        for (const plugin of config.getPlugins()) {
            if (plugin.setup) {
                plugin.setup(source, eventHandler);
            }
        }
        return {
            rules: this.setupRules(config, parser),
        };
    }
    /**
     * Load and setup all rules for current configuration.
     */
    setupRules(config, parser) {
        const rules = {};
        for (const [ruleId, [severity, options]] of config.getRules().entries()) {
            rules[ruleId] = this.loadRule(ruleId, severity, options, parser, this.report);
        }
        return rules;
    }
    /**
     * Load and setup a rule using current config.
     */
    loadRule(ruleId, severity, options, parser, report) {
        const meta = this.config.getMetaTable();
        const rule = this.instantiateRule(ruleId, options);
        rule.name = ruleId;
        rule.init(parser, report, severity, meta);
        /* call setup callback if present */
        if (rule.setup) {
            rule.setup();
        }
        return rule;
    }
    instantiateRule(name, options) {
        if (this.availableRules[name]) {
            const RuleConstructor = this.availableRules[name];
            return new RuleConstructor(options);
        }
        else {
            return this.missingRule(name);
        }
    }
    missingRule(name) {
        return new (class extends rule_1.Rule {
            setup() {
                this.on("dom:load", () => {
                    this.report(null, `Definition for rule '${name}' was not found`);
                });
            }
        })();
    }
    reportError(ruleId, message, location) {
        this.report.addManual(location.filename, {
            ruleId,
            severity: config_1.Severity.ERROR,
            message,
            offset: location.offset,
            line: location.line,
            column: location.column,
            size: location.size || 0,
            selector: null,
        });
    }
}
exports.Engine = Engine;
