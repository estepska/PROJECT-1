"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Selector = void 0;
const combinator_1 = require("./combinator");
const pseudoclass_1 = require("./pseudoclass");
class Matcher {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    match(node) {
        /* istanbul ignore next: only used by fallback solution */
        return false;
    }
}
class ClassMatcher extends Matcher {
    constructor(classname) {
        super();
        this.classname = classname;
    }
    match(node) {
        return node.classList.contains(this.classname);
    }
}
class IdMatcher extends Matcher {
    constructor(id) {
        super();
        this.id = id;
    }
    match(node) {
        return node.id === this.id;
    }
}
class AttrMatcher extends Matcher {
    constructor(attr) {
        super();
        const [, key, op, value] = attr.match(/^(.+?)(?:([~^$*|]?=)"([^"]+?)")?$/);
        this.key = key;
        this.op = op;
        this.value = value;
    }
    match(node) {
        const attr = node.getAttribute(this.key, true) || [];
        return attr.some((cur) => {
            switch (this.op) {
                case undefined:
                    return true; /* attribute exists */
                case "=":
                    return cur.value === this.value;
                default:
                    throw new Error(`Attribute selector operator ${this.op} is not implemented yet`);
            }
        });
    }
}
class PseudoClassMatcher extends Matcher {
    constructor(pseudoclass) {
        super();
        const [, name, args] = pseudoclass.match(/^([^(]+)(?:\((.*)\))?$/);
        this.name = name;
        this.args = args;
    }
    match(node) {
        const fn = pseudoclass_1.factory(this.name);
        return fn(node, this.args);
    }
}
class Pattern {
    constructor(pattern) {
        const match = pattern.match(/^([~+\->]?)((?:[*]|[^.#[:]+)?)(.*)$/);
        match.shift(); /* remove full matched string */
        this.selector = pattern;
        this.combinator = combinator_1.parseCombinator(match.shift());
        this.tagName = match.shift() || "*";
        const p = match[0] ? match[0].split(/(?=[.#[:])/) : [];
        this.pattern = p.map((cur) => Pattern.createMatcher(cur));
    }
    match(node) {
        return (node.is(this.tagName) &&
            this.pattern.every((cur) => cur.match(node)));
    }
    static createMatcher(pattern) {
        switch (pattern[0]) {
            case ".":
                return new ClassMatcher(pattern.slice(1));
            case "#":
                return new IdMatcher(pattern.slice(1));
            case "[":
                return new AttrMatcher(pattern.slice(1, -1));
            case ":":
                return new PseudoClassMatcher(pattern.slice(1));
            default:
                /* istanbul ignore next: fallback solution, the switch cases should cover
                 * everything and there is no known way to trigger this fallback */
                throw new Error(`Failed to create matcher for "${pattern}"`);
        }
    }
}
/**
 * DOM Selector.
 */
class Selector {
    constructor(selector) {
        this.pattern = Selector.parse(selector);
    }
    /**
     * Match this selector against a HtmlElement.
     *
     * @param root Element to match against.
     * @returns Iterator with matched elements.
     */
    *match(root) {
        yield* this.matchInternal(root, 0);
    }
    *matchInternal(root, level) {
        if (level >= this.pattern.length) {
            yield root;
            return;
        }
        const pattern = this.pattern[level];
        const matches = Selector.findCandidates(root, pattern);
        for (const node of matches) {
            if (!pattern.match(node)) {
                continue;
            }
            yield* this.matchInternal(node, level + 1);
        }
    }
    static parse(selector) {
        /* strip whitespace before combinators, "ul > li" becomes "ul >li", for
         * easier parsing */
        selector = selector.replace(/([+~>]) /g, "$1");
        const pattern = selector.split(/ +/);
        return pattern.map((part) => new Pattern(part));
    }
    static findCandidates(root, pattern) {
        switch (pattern.combinator) {
            case combinator_1.Combinator.DESCENDANT:
                return root.getElementsByTagName(pattern.tagName);
            case combinator_1.Combinator.CHILD:
                return root.childElements.filter((node) => node.is(pattern.tagName));
            case combinator_1.Combinator.ADJACENT_SIBLING:
                return Selector.findAdjacentSibling(root);
            case combinator_1.Combinator.GENERAL_SIBLING:
                return Selector.findGeneralSibling(root);
        }
        /* istanbul ignore next: fallback solution, the switch cases should cover
         * everything and there is no known way to trigger this fallback */
        return [];
    }
    static findAdjacentSibling(node) {
        let adjacent = false;
        return node.siblings.filter((cur) => {
            if (adjacent) {
                adjacent = false;
                return true;
            }
            if (cur === node) {
                adjacent = true;
            }
            return false;
        });
    }
    static findGeneralSibling(node) {
        let after = false;
        return node.siblings.filter((cur) => {
            if (after) {
                return true;
            }
            if (cur === node) {
                after = true;
            }
            return false;
        });
    }
}
exports.Selector = Selector;
