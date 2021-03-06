"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSFORMER_API = void 0;
var template_1 = require("./template");
Object.defineProperty(exports, "TemplateExtractor", { enumerable: true, get: function () { return template_1.TemplateExtractor; } });
var helpers_1 = require("./helpers");
Object.defineProperty(exports, "offsetToLineColumn", { enumerable: true, get: function () { return helpers_1.offsetToLineColumn; } });
var TRANSFORMER_API;
(function (TRANSFORMER_API) {
    TRANSFORMER_API[TRANSFORMER_API["VERSION"] = 1] = "VERSION";
})(TRANSFORMER_API = exports.TRANSFORMER_API || (exports.TRANSFORMER_API = {}));
