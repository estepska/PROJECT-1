"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const context_1 = require("../context");
const dom_1 = require("../dom");
const event_1 = require("../event");
const lexer_1 = require("../lexer");
const conditional_comment_1 = require("./conditional-comment");
const parser_error_1 = require("./parser-error");
/**
 * Parse HTML document into a DOM tree.
 */
class Parser {
    /**
     * Create a new parser instance.
     *
     * @param config - Configuration
     */
    constructor(config) {
        this.event = new event_1.EventHandler();
        this.dom = undefined;
        this.metaTable = config.getMetaTable();
    }
    /**
     * Parse HTML markup.
     *
     * @param source - HTML markup.
     * @returns DOM tree representing the HTML markup.
     */
    // eslint-disable-next-line complexity
    parseHtml(source) {
        var _a, _b, _c, _d;
        if (typeof source === "string") {
            source = {
                data: source,
                filename: "inline",
                line: 1,
                column: 1,
                offset: 0,
            };
        }
        /* reset DOM in case there are multiple calls in the same session */
        this.dom = new dom_1.DOMTree({
            filename: (_a = source.filename) !== null && _a !== void 0 ? _a : "",
            offset: (_b = source.offset) !== null && _b !== void 0 ? _b : 0,
            line: (_c = source.line) !== null && _c !== void 0 ? _c : 1,
            column: (_d = source.column) !== null && _d !== void 0 ? _d : 1,
            size: 0,
        });
        /* trigger any rules waiting for DOM load event */
        this.trigger("dom:load", {
            location: null,
        });
        const lexer = new lexer_1.Lexer();
        const tokenStream = lexer.tokenize(source);
        /* consume all tokens from the stream */
        let it = this.next(tokenStream);
        while (!it.done) {
            const token = it.value;
            switch (token.type) {
                case lexer_1.TokenType.TAG_OPEN:
                    this.consumeTag(source, token, tokenStream);
                    break;
                case lexer_1.TokenType.WHITESPACE:
                    this.trigger("whitespace", {
                        text: token.data[0],
                        location: token.location,
                    });
                    this.appendText(token.data[0], token.location);
                    break;
                case lexer_1.TokenType.DIRECTIVE:
                    this.consumeDirective(token);
                    break;
                case lexer_1.TokenType.CONDITIONAL:
                    this.trigger("conditional", {
                        condition: token.data[1],
                        location: token.location,
                    });
                    break;
                case lexer_1.TokenType.COMMENT:
                    this.consumeComment(token);
                    break;
                case lexer_1.TokenType.DOCTYPE_OPEN:
                    this.consumeDoctype(token, tokenStream);
                    break;
                case lexer_1.TokenType.TEXT:
                case lexer_1.TokenType.TEMPLATING:
                    this.appendText(token.data, token.location);
                    break;
                case lexer_1.TokenType.EOF:
                    this.closeTree(source, token.location);
                    break;
            }
            it = this.next(tokenStream);
        }
        /* resolve and dynamic meta element properties */
        this.dom.resolveMeta(this.metaTable);
        /* trigger any rules waiting for DOM ready */
        this.trigger("dom:ready", {
            document: this.dom,
            /* disable location for this event so rules can use implicit node location
             * instead */
            location: null,
        });
        return this.dom;
    }
    /**
     * Detect optional end tag.
     *
     * Some tags have optional end tags (e.g. <ul><li>foo<li>bar</ul> is
     * valid). The parser handles this by checking if the element on top of the
     * stack when is allowed to omit.
     */
    closeOptional(token) {
        /* if the element doesn't have metadata it cannot have optional end
         * tags. Period. */
        const active = this.dom.getActive();
        if (!(active.meta && active.meta.implicitClosed)) {
            return false;
        }
        const tagName = token.data[2];
        const open = !token.data[1];
        const meta = active.meta.implicitClosed;
        if (open) {
            /* a new element is opened, check if the new element should close the
             * previous */
            return meta.indexOf(tagName) >= 0;
        }
        else {
            /* if we are explicitly closing the active element, ignore implicit */
            if (active.is(tagName)) {
                return false;
            }
            /* the parent element is closed, check if the active element would be
             * implicitly closed when parent is. */
            return active.parent.is(tagName) && meta.indexOf(active.tagName) >= 0;
        }
    }
    // eslint-disable-next-line complexity
    consumeTag(source, startToken, tokenStream) {
        const tokens = Array.from(this.consumeUntil(tokenStream, lexer_1.TokenType.TAG_CLOSE, startToken.location));
        const endToken = tokens.slice(-1)[0];
        const closeOptional = this.closeOptional(startToken);
        const parent = closeOptional
            ? this.dom.getActive().parent
            : this.dom.getActive();
        const node = dom_1.HtmlElement.fromTokens(startToken, endToken, parent, this.metaTable);
        const open = !startToken.data[1];
        const close = !open || node.closed !== dom_1.NodeClosed.Open;
        const foreign = node.meta && node.meta.foreign;
        /* if the previous tag to be implicitly closed by the current tag we close
         * it and pop it from the stack before continuing processing this tag */
        if (closeOptional) {
            const active = this.dom.getActive();
            active.closed = dom_1.NodeClosed.ImplicitClosed;
            this.closeElement(source, node, active, startToken.location);
            this.dom.popActive();
        }
        if (open) {
            this.dom.pushActive(node);
            this.trigger("tag:open", {
                target: node,
                location: startToken.location,
            });
        }
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            switch (token.type) {
                case lexer_1.TokenType.WHITESPACE:
                    break;
                case lexer_1.TokenType.ATTR_NAME:
                    this.consumeAttribute(source, node, token, tokens[i + 1]);
                    break;
            }
        }
        if (close) {
            const active = this.dom.getActive();
            /* if this is not an open tag it is a close tag and thus we force it to be
             * one, in case it is detected as void */
            if (!open) {
                node.closed = dom_1.NodeClosed.EndTag;
            }
            this.closeElement(source, node, active, endToken.location);
            /* if this element is closed with an end tag but is would it will not be
             * closed again (it is already closed automatically since it is
             * void). Closing again will have side-effects as it will close the parent
             * and cause a mess later. */
            const voidClosed = !open && node.voidElement;
            if (!voidClosed) {
                this.dom.popActive();
            }
        }
        else if (foreign) {
            /* consume the body of the foreign element so it won't be part of the
             * document (only the root foreign element is).  */
            this.discardForeignBody(source, node.tagName, tokenStream, startToken.location);
        }
    }
    closeElement(source, node, active, location) {
        /* call processElement hook */
        this.processElement(active, source);
        /* trigger event for the closing of the element (the </> tag)*/
        this.trigger("tag:close", {
            target: node,
            previous: active,
            location,
        });
        /* trigger event for for an element being fully constructed. Special care
         * for void elements explicit closed <input></input> */
        if (active && !active.isRootElement()) {
            this.trigger("element:ready", {
                target: active,
                location: active.location,
            });
        }
    }
    processElement(node, source) {
        if (source.hooks && source.hooks.processElement) {
            const processElement = source.hooks.processElement;
            const metaTable = this.metaTable;
            const context = {
                getMetaFor(tagName) {
                    return metaTable.getMetaFor(tagName);
                },
            };
            processElement.call(context, node);
        }
    }
    /**
     * Discard tokens until the end tag for the foreign element is found.
     */
    discardForeignBody(source, foreignTagName, tokenStream, errorLocation) {
        /* consume elements until the end tag for this foreign element is found */
        let nested = 1;
        let startToken;
        let endToken;
        do {
            /* search for tags */
            const tokens = Array.from(this.consumeUntil(tokenStream, lexer_1.TokenType.TAG_OPEN, errorLocation));
            const [last] = tokens.slice(-1);
            const [, tagClosed, tagName] = last.data;
            /* keep going unless the new tag matches the foreign root element */
            if (tagName !== foreignTagName) {
                continue;
            }
            /* locate end token and determine if this is a self-closed tag */
            const endTokens = Array.from(this.consumeUntil(tokenStream, lexer_1.TokenType.TAG_CLOSE, last.location));
            endToken = endTokens.slice(-1)[0];
            const selfClosed = endToken.data[0] === "/>";
            /* since foreign element may be nested keep a count for the number of
             * opened/closed elements */
            if (tagClosed) {
                startToken = last;
                nested--;
            }
            else if (!selfClosed) {
                nested++;
            }
        } while (nested > 0);
        const active = this.dom.getActive();
        const node = dom_1.HtmlElement.fromTokens(startToken, endToken, active, this.metaTable);
        this.closeElement(source, node, active, endToken.location);
        this.dom.popActive();
    }
    consumeAttribute(source, node, token, next) {
        const keyLocation = token.location;
        const valueLocation = this.getAttributeValueLocation(next);
        const haveValue = next && next.type === lexer_1.TokenType.ATTR_VALUE;
        const attrData = {
            key: token.data[1],
        };
        if (haveValue) {
            attrData.value = next.data[1];
            attrData.quote = next.data[2];
        }
        /* get callback to process attributes, default is to just return attribute
         * data right away but a transformer may override it to allow aliasing
         * attributes, e.g ng-attr-foo or v-bind:foo */
        let processAttribute = (attr) => [attr];
        if (source.hooks && source.hooks.processAttribute) {
            processAttribute = source.hooks.processAttribute;
        }
        /* handle deprecated callbacks */
        let iterator;
        const legacy = processAttribute.call({}, attrData);
        if (typeof legacy[Symbol.iterator] !== "function") {
            /* AttributeData */
            iterator = [attrData];
        }
        else {
            /* Iterable<AttributeData> */
            iterator = legacy;
        }
        /* process attribute(s) */
        for (const attr of iterator) {
            this.trigger("attr", {
                target: node,
                key: attr.key,
                value: attr.value,
                quote: attr.quote,
                originalAttribute: attr.originalAttribute,
                location: keyLocation,
                valueLocation,
            });
            node.setAttribute(attr.key, attr.value, keyLocation, valueLocation, attr.originalAttribute);
        }
    }
    /**
     * Take attribute value token and return a new location referring to only the
     * value.
     *
     * foo="bar"    foo='bar'    foo=bar    foo      foo=""
     *      ^^^          ^^^         ^^^    (null)   (null)
     */
    getAttributeValueLocation(token) {
        if (!token || token.type !== lexer_1.TokenType.ATTR_VALUE || token.data[1] === "") {
            return null;
        }
        const quote = token.data[2];
        if (quote) {
            return context_1.sliceLocation(token.location, 2, -1);
        }
        else {
            return context_1.sliceLocation(token.location, 1);
        }
    }
    consumeDirective(token) {
        const directive = token.data[1];
        const match = directive.match(/^([a-zA-Z0-9-]+)\s*(.*?)(?:\s*:\s*(.*))?$/);
        if (!match) {
            throw new Error(`Failed to parse directive "${directive}"`);
        }
        const [, action, data, comment] = match;
        this.trigger("directive", {
            action,
            data,
            comment: comment || "",
            location: token.location,
        });
    }
    /**
     * Consumes comment token.
     *
     * Tries to find IE conditional comments and emits conditional token if found.
     */
    consumeComment(token) {
        const comment = token.data[0];
        for (const conditional of conditional_comment_1.parseConditionalComment(comment, token.location)) {
            this.trigger("conditional", {
                condition: conditional.expression,
                location: conditional.location,
            });
        }
    }
    /**
     * Consumes doctype tokens. Emits doctype event.
     */
    consumeDoctype(startToken, tokenStream) {
        const tokens = Array.from(this.consumeUntil(tokenStream, lexer_1.TokenType.DOCTYPE_CLOSE, startToken.location));
        const doctype = tokens[0]; /* first token is the doctype, second is the closing ">" */
        const value = doctype.data[0];
        this.dom.doctype = value;
        this.trigger("doctype", {
            value,
            valueLocation: tokens[0].location,
            location: startToken.location,
        });
    }
    /**
     * Return a list of tokens found until the expected token was found.
     *
     * @param errorLocation - What location to use if an error occurs
     */
    *consumeUntil(tokenStream, search, errorLocation) {
        let it = this.next(tokenStream);
        while (!it.done) {
            const token = it.value;
            yield token;
            if (token.type === search)
                return;
            it = this.next(tokenStream);
        }
        throw new parser_error_1.ParserError(errorLocation, `stream ended before ${lexer_1.TokenType[search]} token was found`);
    }
    next(tokenStream) {
        return tokenStream.next();
    }
    /**
     * Listen on events.
     *
     * @param event - Event name.
     * @param listener - Event callback.
     * @returns A function to unregister the listener.
     */
    on(event, listener) {
        return this.event.on(event, listener);
    }
    /**
     * Listen on single event. The listener is automatically unregistered once the
     * event has been received.
     *
     * @param event - Event name.
     * @param listener - Event callback.
     * @returns A function to unregister the listener.
     */
    once(event, listener) {
        return this.event.once(event, listener);
    }
    /**
     * Defer execution. Will call function sometime later.
     *
     * @param cb - Callback to execute later.
     */
    defer(cb) {
        this.event.once("*", cb);
    }
    trigger(event, data) {
        if (typeof data.location === "undefined") {
            throw Error("Triggered event must contain location");
        }
        this.event.trigger(event, data);
    }
    /**
     * @hidden
     */
    getEventHandler() {
        return this.event;
    }
    /**
     * Appends a text node to the current element on the stack.
     */
    appendText(text, location) {
        this.dom.getActive().appendText(text, location);
    }
    /**
     * Trigger close events for any still open elements.
     */
    closeTree(source, location) {
        let active;
        while ((active = this.dom.getActive()) && !active.isRootElement()) {
            this.closeElement(source, null, active, location);
            this.dom.popActive();
        }
    }
}
exports.Parser = Parser;
