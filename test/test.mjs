/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it } from '@open-automaton/moka';
import { isBrowser, isJsDom } from 'browser-or-node';
import { 
    traverse, handleErrors, errors, currentDirectoryImportMap 
} from '../src/index.mjs';
const should = chai.should();
// one of the deps will load this global as a side effect in the browser
// the following prevents mocha caring about that.
globalThis.nostr = null;

const depList = [
    '@open-automaton/traverse-dependencies', '@environment-safe/package', 'browser-or-node', '@babel/cli', '@babel/core', '@babel/plugin-transform-modules-commonjs', '@environment-safe/chai', '@environment-safe/commonjs-builder', '@open-automaton/moka', 'babel-plugin-search-and-replace', 'babel-plugin-transform-import-meta', 'chai', 'eslint', 'husky', 'mocha', '@jridgewell/trace-mapping', 'commander', 'convert-source-map', 'fs-readdir-recursive', 'glob', 'make-dir', 'slash', '@ampproject/remapping', '@babel/code-frame', '@babel/generator', '@babel/helper-compilation-targets', '@babel/helper-module-transforms', '@babel/helpers', '@babel/parser', '@babel/template', '@babel/traverse', '@babel/types', 'debug', 'gensync', 'json5', 'semver', '@babel/helper-plugin-utils', 'async-arrays', '@environment-safe/file', '@environment-safe/import-introspect', '@environment-safe/runtime-context', '@open-automaton/automaton', '@open-automaton/cheerio-mining-engine', '@open-automaton/jsdom-mining-engine', '@open-automaton/playwright-mining-engine', '@open-automaton/puppeteer-mining-engine', 'detect-browser', 'express', 'why-is-node-running', 'yargs', 'tslib', 'assertion-error', 'check-error', 'deep-eql', 'get-func-name', 'loupe', 'pathval', 'type-detect', '@eslint-community/eslint-utils', '@eslint-community/regexpp', '@eslint/eslintrc', '@eslint/js', '@humanwhocodes/config-array', '@humanwhocodes/module-importer', '@nodelib/fs.walk', '@ungap/structured-clone', 'ajv', 'chalk', 'cross-spawn', 'doctrine', 'escape-string-regexp', 'eslint-scope', 'eslint-visitor-keys', 'espree', 'esquery', 'esutils', 'fast-deep-equal', 'file-entry-cache', 'find-up', 'glob-parent', 'globals', 'graphemer', 'ignore', 'imurmurhash', 'is-glob', 'is-path-inside', 'js-yaml', 'json-stable-stringify-without-jsonify', 'levn', 'lodash.merge', 'minimatch', 'natural-compare', 'optionator', 'strip-ansi', 'text-table', 'ansi-colors', 'browser-stdout', 'chokidar', 'diff', 'he', 'log-symbols', 'ms', 'serialize-javascript', 'strip-json-comments', 'supports-color', 'workerpool', 'yargs-parser', 'yargs-unparser', '@jridgewell/resolve-uri', '@jridgewell/sourcemap-codec', 'fs.realpath', 'inflight', 'inherits', 'once', 'path-is-absolute', 'pify', '@jridgewell/gen-mapping', '@babel/helper-validator-identifier', 'js-tokens', 'picocolors', 'jsesc', '@babel/helper-validator-option', 'browserslist', 'lru-cache', '@babel/helper-module-imports', '@babel/helper-string-parser', 'sift', 'typescript', 'es-module-lexer', '@open-automaton/automaton-engine', 'carlton', 'clone', 'extended-emitter', 'html-parser', 'libxmljs2', 'postman-request', 'simple-log-function', 'url-parse', 'cheerio', 'async-fn-callback', 'jsdom', '@babel/plugin-syntax-import-assertions', 'playwright', 'puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth', 'accepts', 'array-flatten', 'body-parser', 'content-disposition', 'content-type', 'cookie', 'cookie-signature', 'depd', 'encodeurl', 'escape-html', 'etag', 'finalhandler', 'fresh', 'http-errors', 'merge-descriptors', 'methods', 'on-finished', 'parseurl', 'path-to-regexp', 'proxy-addr', 'qs', 'range-parser', 'safe-buffer', 'send', 'serve-static', 'setprototypeof', 'statuses', 'type-is', 'utils-merge', 'vary', 'siginfo', 'stackback', 'cliui', 'escalade', 'get-caller-file', 'require-directory', 'string-width', 'y18n', 'import-fresh', '@humanwhocodes/object-schema', '@nodelib/fs.scandir', 'fastq', 'fast-json-stable-stringify', 'json-schema-traverse', 'uri-js', 'ansi-styles', 'path-key', 'shebang-command', 'which', 'esrecurse', 'estraverse', 'acorn', 'acorn-jsx', 'flat-cache', 'locate-path', 'path-exists', 'is-extglob', 'argparse', 'prelude-ls', 'type-check', 'brace-expansion', 'deep-is', 'word-wrap', 'fast-levenshtein', 'ansi-regex', 'anymatch', 'braces', 'is-binary-path', 'normalize-path', 'readdirp', 'is-unicode-supported', 'randombytes', 'has-flag', 'camelcase', 'decamelize', 'flat', 'is-plain-obj', 'wrappy', '@jridgewell/set-array', 'caniuse-lite', 'electron-to-chromium', 'update-browserslist-db', 'yallist', 'libxmljs', 'es6-template-strings', '@mapbox/node-pre-gyp', 'bindings', 'nan', '@postman/form-data', '@postman/tough-cookie', '@postman/tunnel-agent', 'aws-sign2', 'aws4', 'caseless', 'combined-stream', 'extend', 'forever-agent', 'http-signature', 'is-typedarray', 'isstream', 'json-stringify-safe', 'mime-types', 'oauth-sign', 'stream-length', 'uuid', 'loglevel', 'querystringify', 'requires-port', 'cheerio-select', 'dom-serializer', 'domhandler', 'domutils', 'encoding-sniffer', 'htmlparser2', 'parse5', 'parse5-htmlparser2-tree-adapter', 'parse5-parser-stream', 'undici', 'whatwg-mimetype', 'abab', 'acorn-globals', 'cssom', 'cssstyle', 'data-urls', 'decimal.js', 'domexception', 'escodegen', 'form-data', 'html-encoding-sniffer', 'http-proxy-agent', 'https-proxy-agent', 'is-potential-custom-element-name', 'nwsapi', 'saxes', 'symbol-tree', 'tough-cookie', 'w3c-hr-time', 'w3c-xmlserializer', 'webidl-conversions', 'whatwg-encoding', 'whatwg-url', 'ws', 'xml-name-validator', 'playwright-core', 'cross-fetch', 'extract-zip', 'pkg-dir', 'progress', 'proxy-from-env', 'rimraf', 'tar-fs', 'unbzip2-stream', 'deepmerge', 'puppeteer-extra-plugin', 'puppeteer-extra-plugin-user-preferences', 'negotiator', 'bytes', 'destroy', 'iconv-lite', 'raw-body', 'unpipe', 'toidentifier', 'ee-first', 'forwarded', 'ipaddr.js', 'side-channel', 'mime', 'media-typer', 'wrap-ansi', 'emoji-regex', 'is-fullwidth-code-point', 'parent-module', 'resolve-from', '@nodelib/fs.stat', 'run-parallel', 'reusify', 'color-convert', 'shebang-regex', 'isexe', 'flatted', 'keyv', 'p-locate', 'balanced-match', 'concat-map', 'picomatch', 'fill-range', 'binary-extensions', 'es5-ext', 'esniff', 'detect-libc', 'node-fetch', 'nopt', 'npmlog', 'tar', 'asynckit', 'psl', 'universalify', 'delayed-stream', 'assert-plus', 'jsprim', 'sshpk', 'mime-db', 'bluebird', 'boolbase', 'css-select', 'css-what', 'domelementtype', 'entities', 'acorn-walk', 'esprima', 'es-set-tostringtag', '@tootallnate/once', 'agent-base', 'xmlchars', 'browser-process-hrtime', 'tr46', 'get-stream', 'yauzl', 'chownr', 'mkdirp-classic', 'pump', 'tar-stream', 'through', 'merge-deep', 'puppeteer-extra-plugin-user-data-dir', 'safer-buffer', 'es-errors', 'object-inspect', 'side-channel-list', 'side-channel-map', 'side-channel-weakmap', 'callsites', 'queue-microtask', 'color-name', 'json-buffer', 'p-limit', 'to-regex-range', 'es6-iterator', 'es6-symbol', 'next-tick', 'd', 'abbrev', 'are-we-there-yet', 'console-control-strings', 'gauge', 'set-blocking', 'fs-minipass', 'minipass', 'minizlib', 'mkdirp', 'extsprintf', 'json-schema', 'verror', 'asn1', 'dashdash', 'getpass', 'jsbn', 'tweetnacl', 'ecc-jsbn', 'bcrypt-pbkdf', 'nth-check', 'get-intrinsic', 'has-tostringtag', 'hasown', 'fd-slicer', 'buffer-crc32', 'end-of-stream', 'bl', 'fs-constants', 'readable-stream', 'arr-union', 'clone-deep', 'kind-of', 'fs-extra', 'call-bound', 'yocto-queue', 'is-number', 'delegates', 'aproba', 'color-support', 'has-unicode', 'object-assign', 'signal-exit', 'wide-align', 'core-util-is', 'call-bind-apply-helpers', 'es-define-property', 'es-object-atoms', 'function-bind', 'get-proto', 'gopd', 'has-symbols', 'pend', 'util-deprecate', 'for-own', 'is-plain-object', 'lazy-cache', 'shallow-clone', 'is-buffer', 'graceful-fs', 'jsonfile', 'for-in', 'isobject', 'is-extendable', 'mixin-object'
];

describe('module', ()=>{
    describe('performs a simple test suite', ()=>{
        //testing using it's own dep tree, which may change as subdeps change
        
        it('loads deps', async ()=>{
            const result = await traverse('.', (pkg, state)=>{
                return {
                    ...(pkg.dependencies || {}),
                    ...(pkg.peerDependencies || {})
                };
            });
            Object.keys(result.seen).should.deep.equal([
                '@open-automaton/traverse-dependencies', 
                '@environment-safe/package', 
                'browser-or-node'
            ]);
        });
        
        it('loads deps + root devdeps', async ()=>{
            const result = await traverse('.', (pkg, state)=>{
                if(pkg.name === '@open-automaton/traverse-dependencies'){
                    return {
                        ...(pkg.dependencies || {}),
                        ...(pkg.devDependencies || {}),
                        ...(pkg.peerDependencies || {})
                    };
                }else{
                    return {
                        ...(pkg.dependencies || {}),
                        ...(pkg.peerDependencies || {})
                    };
                }
            });
            try{
                handleErrors(result, {error: true});
                should.not.exist(true, 'missing dev dependencies should error');
            }catch(ex){
                let testValues = [];
                if(!(isBrowser || isJsDom)){
                    testValues = [
                        '@environment-safe/jsdoc-builder',
                        '@babel/compat-data',
                        'node-releases',
                        'canvas',
                        'devtools-protocol',
                        '@types/debug',
                        '@types/puppeteer',
                        'puppeteer-core',
                        'playwright-extra',
                        'bufferutil',
                        'utf-8-validate',
                        'encoding',
                        'ext',
                        'type',
                        'math-intrinsics',
                        'dunder-proto'
                    ];
                }
                errors(result).names.should.deep.equal(testValues);
            }
        });
        
        it('simple importmap', async ()=>{
            const importMap = await currentDirectoryImportMap(
                '@open-automaton/traverse-dependencies'
            );
            //console.log(Object.keys(importMap).map(v=>`'${v}'`).join(', '))
            should.exist(importMap);
            depList.forEach((depName)=>{
                should.exist(
                    importMap[depName], 
                    `Expected '${depName}' to be in the import-map`
                );
            });
        });
    });
});

