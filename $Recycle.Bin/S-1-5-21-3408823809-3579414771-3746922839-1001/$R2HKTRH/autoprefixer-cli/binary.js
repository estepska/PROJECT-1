'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _autoprefixer = require('autoprefixer');

var _autoprefixer2 = _interopRequireDefault(_autoprefixer);

var _postcss = require('postcss');

var _postcss2 = _interopRequireDefault(_postcss);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var Binary = (function () {
    function Binary(process) {
        _classCallCheck(this, Binary);

        this.arguments = process.argv.slice(2);
        this.stdin = process.stdin;
        this.stderr = process.stderr;
        this.stdout = process.stdout;

        this.status = 0;
        this.command = 'compile';
        this.inputFiles = [];

        this.processOptions = {};
        this.pluginOptions = {};
        this.parseArguments();
    }

    // Quick help message

    Binary.prototype.help = function help() {
        return 'Usage: autoprefixer [OPTION...] FILES\n\nParse CSS files and add prefixed properties and values.\n\nOptions:\n  -b, --browsers BROWSERS  add prefixes for selected browsers\n  -c, --clean              remove all known prefixes\n  -o, --output FILE        set output file\n  -d, --dir DIR            set output dir\n  -m, --map                generate source map\n      --no-map             skip source map even if previous map exists\n      --no-inline-map      do not inline maps to data:uri\n      --inline-map         force inline map\n      --annotation PATH    change map location relative from CSS file\n      --no-map-annotation  do not add source map annotation comment in CSS\n      --no-sources-content remove origin CSS from maps\n      --sources-content    force include origin CSS into map\n      --no-cascade         do not create nice visual cascade of prefixes\n      --no-remove          do not remove outdated prefixes\n  -i, --info               show selected browsers and properties\n  -h, --help               show help text\n  -v, --version            print program version';
    };

    // Options description

    Binary.prototype.desc = function desc() {
        return 'Files:\n  If you didn\'t set input files, autoprefixer will read from stdin stream.\n\n  By default, prefixed CSS will rewrite original files.\n\n  You can specify output file or directory by \'-o\' argument.\n  For several input files you can specify only output directory by \'-d\'.\n\n  Output CSS will be written to stdout stream on \'-o -\' argument or stdin input.\n\nSource maps:\n  On \'-m\' argument Autoprefixer will generate source map for changes near\n  output CSS (for out/main.css it generates out/main.css.map).\n\n  If previous source map will be near input files (for example, in/main.css\n  and in/main.css.map) Autoprefixer will apply previous map to output\n  source map.\n\nBrowsers:\n  Separate browsers by comma. For example, \'-b "> 1%, opera 12"\'.\n  You can set browsers by global usage statictics: \'-b "> 1%"\'.\n  or last version: \'-b "last 2 versions"\'.';
    };

    // Print to stdout

    Binary.prototype.print = function print(str) {
        str = str.replace(/\n$/, '');
        this.stdout.write(str + '\n');
    };

    // Print to stdout

    Binary.prototype.error = function error(str) {
        this.status = 1;
        this.stderr.write(str + '\n');
    };

    // Get current version

    Binary.prototype.version = function version() {
        return require('autoprefixer/package.json').version;
    };

    // Parse arguments

    Binary.prototype.parseArguments = function parseArguments() {
        var args = this.arguments.slice();
        while (args.length > 0) {
            var arg = args.shift();

            if (arg === '-h' || arg === '--help') {
                this.command = 'showHelp';
            } else if (arg === '-v' || arg === '--version') {
                this.command = 'showVersion';
            } else if (arg === '-i' || arg === '--info') {
                this.command = 'info';
            } else if (arg === '-m' || arg === '--map') {
                this.processOptions.map = {};
            } else if (arg === '--no-map') {
                this.processOptions.map = false;
            } else if (arg === '-I' || arg === '--inline-map') {
                if (typeof this.processOptions.map === 'undefined') {
                    this.processOptions.map = {};
                }
                this.processOptions.map.inline = true;
            } else if (arg === '--no-inline-map') {
                if (typeof this.processOptions.map === 'undefined') {
                    this.processOptions.map = {};
                }
                this.processOptions.map.inline = false;
            } else if (arg === '--annotation') {
                if (typeof this.processOptions.map === 'undefined') {
                    this.processOptions.map = {};
                }
                this.processOptions.map.annotation = args.shift();
            } else if (arg === '--no-map-annotation') {
                if (typeof this.processOptions.map === 'undefined') {
                    this.processOptions.map = {};
                }
                this.processOptions.map.annotation = false;
            } else if (arg === '--sources-content') {
                if (typeof this.processOptions.map === 'undefined') {
                    this.processOptions.map = {};
                }
                this.processOptions.map.sourcesContent = true;
            } else if (arg === '--no-sources-content') {
                if (typeof this.processOptions.map === 'undefined') {
                    this.processOptions.map = {};
                }
                this.processOptions.map.sourcesContent = false;
            } else if (arg === '--no-cascade') {
                this.pluginOptions.cascade = false;
            } else if (arg === '--no-remove') {
                this.pluginOptions.remove = false;
            } else if (arg === '-b' || arg === '--browsers') {
                this.pluginOptions.browsers = args.shift().split(',').map(function (i) {
                    return i.trim();
                });
            } else if (arg === '-c' || arg === '--clean') {
                this.pluginOptions.browsers = [];
            } else if (arg === '-o' || arg === '--output') {
                this.outputFile = args.shift();
            } else if (arg === '-d' || arg === '--dir') {
                this.outputDir = args.shift();
            } else if (arg.match(/^-\w$/) || arg.match(/^--\w[\w-]+$/)) {
                this.command = undefined;

                this.error('autoprefixer-cli: Unknown argument ' + arg);
                this.error('');
                this.error(this.help());
            } else {
                this.inputFiles.push(arg);
            }
        }
    };

    // Print help

    Binary.prototype.showHelp = function showHelp(done) {
        this.print(this.help());
        this.print('');
        this.print(this.desc());
        done();
    };

    // Print version

    Binary.prototype.showVersion = function showVersion(done) {
        this.print('autoprefixer-cli ' + this.version());
        done();
    };

    // Print inspect

    Binary.prototype.info = function info(done) {
        this.print(_autoprefixer2['default'](this.pluginOptions).info());
        done();
    };

    // Mark that there is another async work

    Binary.prototype.startWork = function startWork() {
        this.waiting += 1;
    };

    // Execute done callback if there is no works

    Binary.prototype.endWork = function endWork() {
        this.waiting -= 1;
        if (this.waiting <= 0) this.doneCallback();
    };

    // Write error to stderr and finish work

    Binary.prototype.workError = function workError(str) {
        this.error(str);
        this.endWork();
    };

    // Lazy loading for Autoprefixer instance

    Binary.prototype.compiler = function compiler() {
        if (!this.compilerCache) {
            this.compilerCache = _postcss2['default']([_autoprefixer2['default'](this.pluginOptions)]);
        }
        return this.compilerCache;
    };

    // Compile loaded CSS

    Binary.prototype.compileCSS = function compileCSS(css, output, input) {
        var _this = this;

        var opts = {};
        for (var _name in this.processOptions) {
            opts[_name] = this.processOptions[_name];
        }
        if (input) opts.from = input;
        if (output !== '-') opts.to = output;

        this.compiler().process(css, opts)['catch'](function (err) {
            if (err.name === 'BrowserslistError' || err.autoprefixer) {
                _this.error('autoprefixer-cli: ' + err.message);
            } else if (err.name === 'CssSyntaxError') {
                var text = err.message + err.showSourceCode();
                _this.error('autoprefixer-cli:' + text);
            } else {
                _this.error('autoprefixer-cli: Internal error\n');
                if (err.stack) {
                    _this.error(err.stack);
                } else {
                    _this.error(err.message);
                }
            }
            _this.endWork();
        }).then(function (result) {
            result.warnings().forEach(function (warn) {
                _this.stderr.write(warn.toString() + '\n');
            });

            if (output === '-') {
                _this.print(result.css);
                _this.endWork();
            } else {
                _fsExtra2['default'].outputFile(output, result.css, function (err1) {
                    if (err1) _this.error('autoprefixer-cli: ' + err1);

                    if (result.map) {
                        var map = undefined;
                        if (opts.map && opts.map.annotation) {
                            map = _path2['default'].resolve(_path2['default'].dirname(output), opts.map.annotation);
                        } else {
                            map = output + '.map';
                        }
                        _fsExtra2['default'].writeFile(map, result.map, function (err2) {
                            if (err2) {
                                _this.error('autoprefixer-cli: ' + err2);
                            }
                            _this.endWork();
                        });
                    } else {
                        _this.endWork();
                    }
                });
            }
        });
    };

    // Return input and output files array

    Binary.prototype.files = function files() {
        if (this.inputFiles.length === 0 && !this.outputFile) {
            this.outputFile = '-';
        }

        var file = undefined;
        var list = [];
        if (this.outputDir) {
            if (this.inputFiles.length === 0) {
                this.error('autoprefixer-cli: For STDIN input you need ' + 'to specify output file (by -o FILE),\n ' + 'not output dir');
                return false;
            }

            var dir = this.outputDir;
            if (_fsExtra2['default'].existsSync(dir) && !_fsExtra2['default'].statSync(dir).isDirectory()) {
                this.error('autoprefixer-cli: Path ' + dir + ' is a file, not directory');
                return false;
            }

            var output = undefined;
            for (var _iterator = this.inputFiles, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
                if (_isArray) {
                    if (_i >= _iterator.length) break;
                    file = _iterator[_i++];
                } else {
                    _i = _iterator.next();
                    if (_i.done) break;
                    file = _i.value;
                }

                output = _path2['default'].join(this.outputDir, _path2['default'].basename(file));
                list.push([file, output]);
            }
        } else if (this.outputFile) {
            if (this.inputFiles.length > 1) {
                this.error('autoprefixer-cli: For several files you can ' + 'specify only output dir (by -d DIR`),\n' + 'not one output file');
                return false;
            }

            for (var _iterator2 = this.inputFiles, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
                if (_isArray2) {
                    if (_i2 >= _iterator2.length) break;
                    file = _iterator2[_i2++];
                } else {
                    _i2 = _iterator2.next();
                    if (_i2.done) break;
                    file = _i2.value;
                }

                list.push([file, this.outputFile]);
            }
        } else {
            for (var _iterator3 = this.inputFiles, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
                if (_isArray3) {
                    if (_i3 >= _iterator3.length) break;
                    file = _iterator3[_i3++];
                } else {
                    _i3 = _iterator3.next();
                    if (_i3.done) break;
                    file = _i3.value;
                }

                list.push([file, file]);
            }
        }

        return list;
    };

    // Compile selected files

    Binary.prototype.compile = function compile(done) {
        var _this2 = this;

        this.waiting = 0;
        this.doneCallback = done;

        var files = this.files();
        if (files === false) return done();

        if (files.length === 0) {
            (function () {
                _this2.startWork();

                var css = '';
                _this2.stdin.resume();
                _this2.stdin.on('data', function (chunk) {
                    return css += chunk;
                });
                _this2.stdin.on('end', function () {
                    _this2.compileCSS(css, _this2.outputFile);
                });
            })();
        } else {
            var i = undefined,
                input = undefined,
                output = undefined;
            for (i = 0; i < files.length; i++) {
                this.startWork();
            }
            for (i = 0; i < files.length; i++) {
                var _files$i = files[i];
                input = _files$i[0];
                output = _files$i[1];

                if (!_fsExtra2['default'].existsSync(input)) {
                    this.workError('autoprefixer-cli: File ' + input + ' ' + 'doesn\'t exists');
                    continue;
                }

                (function (input2, output2) {
                    _fsExtra2['default'].readFile(input2, function (error, css) {
                        if (error) {
                            _this2.workError('autoprefixer-cli: ' + error.message);
                        } else {
                            _this2.compileCSS(css, output2, input2);
                        }
                    });
                })(input, output);
            }
        }
    };

    // Execute command selected by arguments

    Binary.prototype.run = function run(done) {
        if (this.command) {
            this[this.command](done);
        } else {
            done();
        }
    };

    return Binary;
})();

exports['default'] = Binary;
module.exports = exports['default'];