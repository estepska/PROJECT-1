"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ruleDocumentationUrl = exports.Rule = void 0;
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const homepage = require("../package.json").homepage;
class Rule {
    constructor(options) {
        this.options = options;
        this.enabled = true;
    }
    getSeverity() {
        return this.severity;
    }
    setServerity(severity) {
        this.severity = severity;
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * Returns `true` if rule is deprecated.
     *
     * Overridden by subclasses.
     */
    get deprecated() {
        return false;
    }
    /**
     * Test if rule is enabled.
     *
     * To be considered enabled the enabled flag must be true and the severity at
     * least warning.
     */
    isEnabled() {
        return this.enabled && this.severity >= config_1.Severity.WARN;
    }
    /**
     * Check if keyword is being ignored by the current rule configuration.
     *
     * This method requires the [[RuleOption]] type to include two properties:
     *
     * - include: string[] | null
     * - exclude: string[] | null
     *
     * This methods checks if the given keyword is included by "include" but not
     * excluded by "exclude". If any property is unset it is skipped by the
     * condition. Usually the user would use either one but not both but there is
     * no limitation to use both but the keyword must satisfy both conditions. If
     * either condition fails `true` is returned.
     *
     * For instance, given `{ include: ["foo"] }` the keyword `"foo"` would match
     * but not `"bar"`.
     *
     * Similarly, given `{ exclude: ["foo"] }` the keyword `"bar"` would match but
     * not `"foo"`.
     *
     * @param keyword - Keyword to match against `include` and `exclude` options.
     * @returns `true` if keyword is not present in `include` or is present in
     * `exclude`.
     */
    isKeywordIgnored(keyword) {
        const { include, exclude } = this.options;
        /* ignore keyword if not present in "include" */
        if (include && !include.includes(keyword)) {
            return true;
        }
        /* ignore keyword if present in "excludes" */
        if (exclude && exclude.includes(keyword)) {
            return true;
        }
        return false;
    }
    /**
     * Find all tags which has enabled given property.
     */
    getTagsWithProperty(propName) {
        return this.meta.getTagsWithProperty(propName);
    }
    /**
     * Find tag matching tagName or inheriting from it.
     */
    getTagsDerivedFrom(tagName) {
        return this.meta.getTagsDerivedFrom(tagName);
    }
    /**
     * Report a new error.
     *
     * Rule must be enabled both globally and on the specific node for this to
     * have any effect.
     */
    report(node, message, location, context) {
        if (this.isEnabled() && (!node || node.ruleEnabled(this.name))) {
            const where = this.findLocation({ node, location, event: this.event });
            this.reporter.add(this, message, this.severity, node, where, context);
        }
    }
    findLocation(src) {
        if (src.location) {
            return src.location;
        }
        if (src.event && src.event.location) {
            return src.event.location;
        }
        if (src.node && src.node.location) {
            return src.node.location;
        }
        return {};
    }
    on(event, callback) {
        this.parser.on(event, (event, data) => {
            if (this.isEnabled()) {
                this.event = data;
                callback(data);
            }
        });
    }
    /**
     * Called by [[Engine]] when initializing the rule.
     *
     * Do not override this, use the `setup` callback instead.
     *
     * @hidden
     */
    init(parser, reporter, severity, meta) {
        this.parser = parser;
        this.reporter = reporter;
        this.severity = severity;
        this.meta = meta;
    }
    /**
     * Rule documentation callback.
     *
     * Called when requesting additional documentation for a rule. Some rules
     * provide additional context to provide context-aware suggestions.
     *
     * @param context - Error context given by a reported error.
     * @returns Rule documentation and url with additional details or `null` if no
     * additional documentation is available.
     */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    documentation(context) {
        return null;
    }
}
exports.Rule = Rule;
function ruleDocumentationUrl(filename) {
    const p = path_1.default.parse(filename);
    return `${homepage}/rules/${p.name}.html`;
}
exports.ruleDocumentationUrl = ruleDocumentationUrl;
