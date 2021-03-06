"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Configuration loader.
 *
 * Handles configuration lookup and cache results. When performing lookups
 * parent directories is searched as well and the result is merged together.
 */
class ConfigLoader {
    /**
     * @param configClass - Override class to construct.
     */
    constructor(configClass) {
        this.cache = new Map();
        this.configClass = configClass;
    }
    /**
     * Flush configuration cache.
     *
     * @param filename If given only the cache for that file is flushed.
     */
    flush(filename) {
        if (filename) {
            this.cache.delete(filename);
        }
        else {
            this.cache.clear();
        }
    }
    /**
     * Get configuration for file.
     *
     * Searches parent directories for configuration and merges the result.
     *
     * @param filename Filename to get configuration for.
     */
    fromTarget(filename) {
        if (filename === "inline") {
            return this.configClass.empty();
        }
        if (this.cache.has(filename)) {
            return this.cache.get(filename);
        }
        let current = path_1.default.resolve(path_1.default.dirname(filename));
        let config = this.configClass.empty();
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const search = path_1.default.join(current, ".htmlvalidate.json");
            if (fs_1.default.existsSync(search)) {
                const local = this.configClass.fromFile(search);
                config = local.merge(config);
            }
            /* stop if a configuration with "root" is set to true */
            if (config.isRootFound()) {
                break;
            }
            /* get the parent directory */
            const child = current;
            current = path_1.default.dirname(current);
            /* stop if this is the root directory */
            if (current === child) {
                break;
            }
        }
        this.cache.set(filename, config);
        return config;
    }
}
exports.ConfigLoader = ConfigLoader;
