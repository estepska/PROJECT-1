"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventHandler = void 0;
class EventHandler {
    constructor() {
        this.listeners = {};
    }
    /**
     * Add an event listener.
     *
     * @param event {string} - Event names (comma separated) or '*' for any event.
     * @param callback {function} - Called any time even triggers.
     * @return deregistration function.
     */
    on(event, callback) {
        const names = event.split(",").map((x) => x.trim());
        for (const name of names) {
            this.listeners[name] = this.listeners[name] || [];
            this.listeners[name].push(callback);
        }
        return () => {
            for (const name of names) {
                this.listeners[name] = this.listeners[name].filter((fn) => {
                    return fn !== callback;
                });
            }
        };
    }
    /**
     * Add a onetime event listener. The listener will automatically be removed
     * after being triggered once.
     *
     * @param event {string} - Event names (comma separated) or '*' for any event.
     * @param callback {function} - Called any time even triggers.
     * @return deregistration function.
     */
    once(event, callback) {
        const deregister = this.on(event, (event, data) => {
            callback(event, data);
            deregister();
        });
        return deregister;
    }
    /**
     * Trigger event causing all listeners to be called.
     *
     * @param event {string} - Event name.
     * @param [data] {any} - Event data.
     */
    trigger(event, data) {
        const callbacks = [].concat(this.listeners[event] || [], this.listeners["*"] || []);
        callbacks.forEach((listener) => {
            listener.call(null, event, data);
        });
    }
}
exports.EventHandler = EventHandler;
exports.default = EventHandler;
