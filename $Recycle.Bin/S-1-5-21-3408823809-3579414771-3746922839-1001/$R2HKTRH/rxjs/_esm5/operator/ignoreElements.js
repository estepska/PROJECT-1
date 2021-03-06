/** PURE_IMPORTS_START .._operators_ignoreElements PURE_IMPORTS_END */
import { ignoreElements as higherOrder } from '../operators/ignoreElements';
/**
 * Ignores all items emitted by the source Observable and only passes calls of `complete` or `error`.
 *
 * <img src="./img/ignoreElements.png" width="100%">
 *
 * @return {Observable} An empty Observable that only calls `complete`
 * or `error`, based on which one is called by the source Observable.
 * @method ignoreElements
 * @owner Observable
 */
export function ignoreElements() {
    return higherOrder()(this);
}
;
//# sourceMappingURL=ignoreElements.js.map
