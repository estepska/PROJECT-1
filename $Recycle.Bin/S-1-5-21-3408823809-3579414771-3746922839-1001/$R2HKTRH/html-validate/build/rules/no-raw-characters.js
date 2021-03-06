"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("../context");
const dom_1 = require("../dom");
const rule_1 = require("../rule");
const defaults = {
    relaxed: false,
};
const textRegexp = /([<>]|&(?![a-zA-Z0-9#]+;))/g;
const unquotedAttrRegexp = /([<>"'=`]|&(?![a-zA-Z0-9#]+;))/g;
const matchTemplate = /^(<%.*?%>|<\?.*?\?>|<\$.*?\$>)$/;
const replacementTable = new Map([
    ['"', "&quot;"],
    ["&", "&amp;"],
    ["'", "&apos;"],
    ["<", "&lt;"],
    ["=", "&equals;"],
    [">", "&gt;"],
    ["`", "&grave;"],
]);
class NoRawCharacters extends rule_1.Rule {
    constructor(options) {
        super(Object.assign({}, defaults, options));
        this.relaxed = this.options.relaxed;
    }
    documentation() {
        return {
            description: `Some characters such as \`<\`, \`>\` and \`&\` hold special meaning in HTML and must be escaped using a character reference (html entity).`,
            url: rule_1.ruleDocumentationUrl(__filename),
        };
    }
    setup() {
        this.on("element:ready", (event) => {
            const node = event.target;
            /* only iterate over direct descendants */
            for (const child of node.childNodes) {
                if (child.nodeType !== dom_1.NodeType.TEXT_NODE) {
                    continue;
                }
                /* workaround for templating <% ... %> etc */
                if (child.textContent.match(matchTemplate)) {
                    continue;
                }
                this.findRawChars(node, child.textContent, child.location, textRegexp);
            }
        });
        this.on("attr", (event) => {
            /* boolean attributes has no value so nothing to validate */
            if (!event.value) {
                return;
            }
            /* quoted attribute values can contain most symbols except the quotemark
             * itself but unescaped quotemarks would cause a parsing error */
            if (event.quote) {
                return;
            }
            this.findRawChars(event.target, event.value.toString(), event.valueLocation, unquotedAttrRegexp);
        });
    }
    /**
     * Find raw special characters and report as errors.
     *
     * @param text - The full text to find unescaped raw characters in.
     * @param location - Location of text.
     * @param regexp - Regexp pattern to match using.
     * @param ignore - List of characters to ignore for this text.
     */
    findRawChars(node, text, location, regexp) {
        let match;
        do {
            match = regexp.exec(text);
            if (match) {
                const char = match[0];
                /* In relaxed mode & only needs to be encoded if it is ambiguous,
                 * however this rule will only match either non-ambiguous ampersands or
                 * ampersands part of a character reference. Whenever it is a valid
                 * character reference or not not checked by this rule */
                if (this.relaxed && char === "&") {
                    continue;
                }
                /* determine replacement character and location */
                const replacement = replacementTable.get(char);
                const charLocation = context_1.sliceLocation(location, match.index, match.index + 1);
                /* report as error */
                this.report(node, `Raw "${char}" must be encoded as "${replacement}"`, charLocation);
            }
        } while (match);
    }
}
exports.default = NoRawCharacters;
