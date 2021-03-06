"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = exports.InvalidTokenError = void 0;
const context_1 = require("../context");
const token_1 = require("./token");
var State;
(function (State) {
    State[State["INITIAL"] = 1] = "INITIAL";
    State[State["DOCTYPE"] = 2] = "DOCTYPE";
    State[State["TEXT"] = 3] = "TEXT";
    State[State["TAG"] = 4] = "TAG";
    State[State["ATTR"] = 5] = "ATTR";
    State[State["CDATA"] = 6] = "CDATA";
    State[State["SCRIPT"] = 7] = "SCRIPT";
})(State || (State = {}));
/* eslint-disable no-useless-escape */
const MATCH_WHITESPACE = /^(?:\r\n|\r|\n|[ \t]+(?:\r\n|\r|\n)?)/;
const MATCH_DOCTYPE_OPEN = /^<!(?:DOCTYPE|doctype)\s/;
const MATCH_DOCTYPE_VALUE = /^[^>]+/;
const MATCH_DOCTYPE_CLOSE = /^>/;
const MATCH_XML_TAG = /^<\?xml.*?\?>\n/;
const MATCH_TAG_OPEN = /^<(\/?)([a-zA-Z0-9\-:]+)/; // https://www.w3.org/TR/html/syntax.html#start-tags
const MATCH_TAG_CLOSE = /^\/?>/;
const MATCH_TEXT = /^[^]*?(?=(?:[ \t]*(?:\r\n|\r|\n)|<[^ ]|$))/;
const MATCH_TEMPLATING = /^(?:<%.*?%>|<\?.*?\?>|<\$.*?\$>)/;
const MATCH_TAG_LOOKAHEAD = /^[^]*?(?=<|$)/;
const MATCH_ATTR_START = /^([^\t\r\n\f \/><"'=]+)/; // https://www.w3.org/TR/html/syntax.html#elements-attributes
const MATCH_ATTR_SINGLE = /^\s*=\s*'([^']*?)(')/;
const MATCH_ATTR_DOUBLE = /^\s*=\s*"([^"]*?)(")/;
const MATCH_ATTR_UNQUOTED = /^\s*=\s*([^\t\r\n\f "'<>][^\t\r\n\f <>]*)/;
const MATCH_CDATA_BEGIN = /^<!\[CDATA\[/;
const MATCH_CDATA_END = /^[^]*?]]>/;
const MATCH_SCRIPT_DATA = /^[^]*?(?=<\/script)/;
const MATCH_SCRIPT_END = /^<(\/)(script)/;
const MATCH_DIRECTIVE = /^<!--\s\[html-validate-(.*?)]\s-->/;
const MATCH_COMMENT = /^<!--([^]*?)-->/;
const MATCH_CONDITIONAL = /^<!\[([^\]]*?)\]>/;
class InvalidTokenError extends Error {
    constructor(location, message) {
        super(message);
        this.location = location;
    }
}
exports.InvalidTokenError = InvalidTokenError;
class Lexer {
    // eslint-disable-next-line complexity
    *tokenize(source) {
        const context = new context_1.Context(source);
        context.state = State.INITIAL;
        /* for sanity check */
        let previousState = context.state;
        let previousLength = context.string.length;
        while (context.string.length > 0) {
            switch (context.state) {
                case State.INITIAL:
                    yield* this.tokenizeInitial(context);
                    break;
                case State.DOCTYPE:
                    yield* this.tokenizeDoctype(context);
                    break;
                case State.TAG:
                    yield* this.tokenizeTag(context);
                    break;
                case State.ATTR:
                    yield* this.tokenizeAttr(context);
                    break;
                case State.TEXT:
                    yield* this.tokenizeText(context);
                    break;
                case State.CDATA:
                    yield* this.tokenizeCDATA(context);
                    break;
                case State.SCRIPT:
                    yield* this.tokenizeScript(context);
                    break;
                /* istanbul ignore next: sanity check: should not happen unless adding new states */
                default:
                    this.unhandled(context);
            }
            /* sanity check: state or string must change, if both are intact
             * we are stuck in an endless loop. */
            /* istanbul ignore next: no easy way to test this as it is a condition which should never happen */
            if (context.state === previousState &&
                context.string.length === previousLength) {
                this.errorStuck(context);
            }
            previousState = context.state;
            previousLength = context.string.length;
        }
        yield this.token(context, token_1.TokenType.EOF);
    }
    token(context, type, data) {
        const size = data ? data[0].length : undefined;
        const location = context.getLocation(size);
        return {
            type,
            location,
            data: data ? [].concat(data) : null,
        };
    }
    /* istanbul ignore next: used to provide a better error when an unhandled state happens */
    unhandled(context) {
        const truncated = JSON.stringify(context.string.length > 13
            ? `${context.string.slice(0, 15)}...`
            : context.string);
        const state = State[context.state];
        const message = `failed to tokenize ${truncated}, unhandled state ${state}.`;
        throw new InvalidTokenError(context.getLocation(), message);
    }
    /* istanbul ignore next: used to provide a better error when lexer is detected to be stuck, no known way to reproduce */
    errorStuck(context) {
        const state = State[context.state];
        const message = `failed to tokenize ${context.getTruncatedLine()}, state ${state} failed to consume data or change state.`;
        throw new InvalidTokenError(context.getLocation(), message);
    }
    evalNextState(nextState, token) {
        if (typeof nextState === "function") {
            return nextState(token);
        }
        else {
            return nextState;
        }
    }
    *match(context, tests, error) {
        let match;
        const n = tests.length;
        for (let i = 0; i < n; i++) {
            const [regex, nextState, tokenType] = tests[i];
            if (regex === false || (match = context.string.match(regex))) {
                let token = null;
                if (tokenType !== false) {
                    yield (token = this.token(context, tokenType, match));
                }
                const state = this.evalNextState(nextState, token);
                context.consume(match || 0, state);
                this.enter(context, state, match);
                return;
            }
        }
        const message = `failed to tokenize ${context.getTruncatedLine()}, ${error}.`;
        throw new InvalidTokenError(context.getLocation(), message);
    }
    /**
     * Called when entering a new state.
     */
    enter(context, state, data) {
        /* script tags require a different content model */
        if (state === State.TAG && data && data[0][0] === "<") {
            if (data[0] === "<script") {
                context.contentModel = context_1.ContentModel.SCRIPT;
            }
            else {
                context.contentModel = context_1.ContentModel.TEXT;
            }
        }
    }
    *tokenizeInitial(context) {
        yield* this.match(context, [
            [MATCH_XML_TAG, State.INITIAL, false],
            [MATCH_DOCTYPE_OPEN, State.DOCTYPE, token_1.TokenType.DOCTYPE_OPEN],
            [MATCH_WHITESPACE, State.INITIAL, token_1.TokenType.WHITESPACE],
            [false, State.TEXT, false],
        ], "expected doctype");
    }
    *tokenizeDoctype(context) {
        yield* this.match(context, [
            [MATCH_WHITESPACE, State.DOCTYPE, token_1.TokenType.WHITESPACE],
            [MATCH_DOCTYPE_VALUE, State.DOCTYPE, token_1.TokenType.DOCTYPE_VALUE],
            [MATCH_DOCTYPE_CLOSE, State.TEXT, token_1.TokenType.DOCTYPE_CLOSE],
        ], "expected doctype name");
    }
    *tokenizeTag(context) {
        function nextState(token) {
            switch (context.contentModel) {
                case context_1.ContentModel.TEXT:
                    return State.TEXT;
                case context_1.ContentModel.SCRIPT:
                    if (token.data[0][0] !== "/") {
                        return State.SCRIPT;
                    }
                    else {
                        return State.TEXT; /* <script/> (not legal but handle it anyway so the lexer doesn't choke on it) */
                    }
            }
            /* istanbul ignore next: not covered by a test as there is currently no
             * way to trigger this unless new content models are added but this will
             * add a saner default if anyone ever does */
            return context.contentModel !== context_1.ContentModel.SCRIPT
                ? State.TEXT
                : State.SCRIPT;
        }
        yield* this.match(context, [
            [MATCH_TAG_CLOSE, nextState, token_1.TokenType.TAG_CLOSE],
            [MATCH_ATTR_START, State.ATTR, token_1.TokenType.ATTR_NAME],
            [MATCH_WHITESPACE, State.TAG, token_1.TokenType.WHITESPACE],
        ], 'expected attribute, ">" or "/>"');
    }
    *tokenizeAttr(context) {
        yield* this.match(context, [
            [MATCH_ATTR_SINGLE, State.TAG, token_1.TokenType.ATTR_VALUE],
            [MATCH_ATTR_DOUBLE, State.TAG, token_1.TokenType.ATTR_VALUE],
            [MATCH_ATTR_UNQUOTED, State.TAG, token_1.TokenType.ATTR_VALUE],
            [false, State.TAG, false],
        ], 'expected attribute, ">" or "/>"');
    }
    *tokenizeText(context) {
        yield* this.match(context, [
            [MATCH_WHITESPACE, State.TEXT, token_1.TokenType.WHITESPACE],
            [MATCH_CDATA_BEGIN, State.CDATA, false],
            [MATCH_DIRECTIVE, State.TEXT, token_1.TokenType.DIRECTIVE],
            [MATCH_CONDITIONAL, State.TEXT, token_1.TokenType.CONDITIONAL],
            [MATCH_COMMENT, State.TEXT, token_1.TokenType.COMMENT],
            [MATCH_TEMPLATING, State.TEXT, token_1.TokenType.TEMPLATING],
            [MATCH_TAG_OPEN, State.TAG, token_1.TokenType.TAG_OPEN],
            [MATCH_TEXT, State.TEXT, token_1.TokenType.TEXT],
            [MATCH_TAG_LOOKAHEAD, State.TEXT, token_1.TokenType.TEXT],
        ], 'expected text or "<"');
    }
    *tokenizeCDATA(context) {
        yield* this.match(context, [[MATCH_CDATA_END, State.TEXT, false]], "expected ]]>");
    }
    *tokenizeScript(context) {
        yield* this.match(context, [
            [MATCH_SCRIPT_END, State.TAG, token_1.TokenType.TAG_OPEN],
            [MATCH_SCRIPT_DATA, State.SCRIPT, token_1.TokenType.SCRIPT],
        ], "expected </script>");
    }
}
exports.Lexer = Lexer;
