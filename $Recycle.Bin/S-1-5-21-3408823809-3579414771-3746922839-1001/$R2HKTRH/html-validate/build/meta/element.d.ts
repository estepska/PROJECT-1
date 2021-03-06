export interface PermittedGroup {
    exclude?: string | string[];
}
export declare type PropertyExpression = string | [string, any];
export declare type PermittedEntry = string | any[] | PermittedGroup;
export declare type Permitted = PermittedEntry[];
export declare type PermittedOrder = string[];
export declare type RequiredAncestors = string[];
export declare type RequiredContent = string[];
export interface PermittedAttribute {
    [key: string]: Array<string | RegExp>;
}
export interface DeprecatedElement {
    message?: string;
    documentation?: string;
    source?: string;
}
export interface MetaData {
    inherit?: string;
    metadata?: boolean | PropertyExpression;
    flow?: boolean | PropertyExpression;
    sectioning?: boolean | PropertyExpression;
    heading?: boolean | PropertyExpression;
    phrasing?: boolean | PropertyExpression;
    embedded?: boolean | PropertyExpression;
    interactive?: boolean | PropertyExpression;
    deprecated?: boolean | string | DeprecatedElement;
    foreign?: boolean;
    void?: boolean;
    transparent?: boolean;
    implicitClosed?: string[];
    scriptSupporting?: boolean;
    form?: boolean;
    deprecatedAttributes?: string[];
    requiredAttributes?: string[];
    attributes?: PermittedAttribute;
    permittedContent?: Permitted;
    permittedDescendants?: Permitted;
    permittedOrder?: PermittedOrder;
    requiredAncestors?: RequiredAncestors;
    requiredContent?: RequiredContent;
}
/**
 * Properties listed here can be used to reverse search elements with the given
 * property enabled. See [[MetaTable.getTagsWithProperty]].
 */
export declare type MetaLookupableProperty = "metadata" | "flow" | "sectioning" | "heading" | "phrasing" | "embedded" | "interactive" | "deprecated" | "foreign" | "void" | "transparent" | "scriptSupporting" | "form";
/**
 * Properties listed here can be copied (loaded) onto another element using
 * [[HtmlElement.loadMeta]].
 */
export declare const MetaCopyableProperty: string[];
export interface MetaElement extends MetaData {
    tagName: string;
    [key: string]: undefined | boolean | DeprecatedElement | PropertyExpression | Permitted | PermittedOrder | PermittedAttribute | RequiredAncestors;
}
export interface MetaDataTable {
    [tagName: string]: MetaData;
}
export interface ElementTable {
    [tagName: string]: MetaElement;
}
