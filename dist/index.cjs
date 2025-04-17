"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.traverse = exports.handleErrors = exports.errors = exports.currentDirectoryImportMap = exports.collectDevAndDepModules = void 0;
var _browserOrNode = require("browser-or-node");
var mod = _interopRequireWildcard(require("module"));
var path = _interopRequireWildcard(require("path"));
var _package = require("@environment-safe/package");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
let internalRequire = null;
if (typeof require !== 'undefined') internalRequire = require;
const ensureRequire = () => !internalRequire && (internalRequire = mod.createRequire(require('url').pathToFileURL(__filename).toString()));
const getCommonJS = (pkg, args = {}, options = {}) => {
  return options.prefix + ['node_modules', pkg.name, pkg.exports && pkg.exports['.'] && pkg.exports['.'].require ? pkg.exports['.'].require : (pkg.type === 'commonjs' || !pkg.type) && (pkg.commonjs || pkg.main) || pkg.commonjs || args.r && pkg.main].join('/');
};
const getModule = (pkg, args = {}, options = {}) => {
  return (options.prefix || '') + ['node_modules', pkg.name, pkg.exports && pkg.exports['.'] && pkg.exports['.'].import ? pkg.exports['.'].import : pkg.type === 'module' && (pkg.module || pkg.main) || pkg.module || args.r && pkg.main].join('/');
};
const traversal = {};
traversal.recursive = async (name, resolve, handle, state = {
  modules: {}
}) => {
  const pkg = await (0, _package.getPackage)(name);
  if (!pkg) throw new Error('could not load ' + path.join(process.cwd(), 'package.json'));
  const dependencies = await handle(pkg, state, {
    commonjs: getCommonJS(pkg),
    module: getModule(pkg)
  });
  for (let lcv = 0; lcv < dependencies.length; lcv++) {
    traversal.recursive(dependencies[lcv], resolve, handle, state);
  }
  return state;
};
traversal.unrolled = async (name, resolve, handle, state = {
  seen: {},
  modules: {}
}) => {
  const pkg = await (0, _package.getPackage)(name);
  if (!pkg) throw new Error('could not load ' + path.join(process.cwd(), 'package.json'));
  state.seen[pkg.name] = true;
  let moduleName = null;
  let module = null;
  let subpkg = null;
  let commonjs = null;
  state.seen[pkg.name] = true;
  let deps = await handle(pkg, state, {
    commonjs: getCommonJS(pkg),
    module: getModule(pkg)
  });
  let list = Object.keys(deps);
  while (list.length) {
    moduleName = list.shift();
    if (state.seen[moduleName]) continue;
    let thisPath = null;
    try {
      thisPath = await resolve(moduleName);
      let localPath = thisPath;
      if (!(_browserOrNode.isBrowser || _browserOrNode.isJsDom)) {
        //todo: bake into resolve?
        const parts = thisPath.split(`/${moduleName}/`);
        parts.pop();
        const joined = parts.join(`/${moduleName}/`);
        localPath = joined ? joined + `/${moduleName}/` : `${moduleName}/`;
      }
      subpkg = await (0, _package.getPackage)(localPath);
      let dependencies = [];
      if (!subpkg) {
        state.seen[moduleName] = new Error(`Could load '${localPath}' package.json`);
      } else {
        state.seen[moduleName] = true;
        commonjs = getCommonJS(subpkg);
        module = getModule(subpkg);
        dependencies = await handle(subpkg, state, {
          commonjs,
          module
        });
      }
      state.seen[moduleName] = true;
      Object.keys(dependencies || {}).forEach(dep => {
        if (list.indexOf(dep) === -1 && !state.seen[dep]) {
          list.push(dep);
        }
      });
    } catch (ex) {
      state.seen[moduleName] = new Error(`Could not find ${moduleName}`);
    }
  }
  return state;
};
const universalResolve = name => {
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    const resolution = `/node_modules/${name}`;
    return resolution;
  } else {
    if (!internalRequire) ensureRequire();
    return internalRequire.resolve(`${name}`);
  }
};
const traverse = (name, handle) => {
  return traverse.unrolled(name, universalResolve, handle);
};
exports.traverse = traverse;
traverse.unrolled = traversal.unrolled;
traverse.recursive = traversal.recursive;
const errors = state => {
  const keys = Object.keys(state.seen);
  const failedModules = keys.filter(v => state.seen[v] instanceof Error);
  return {
    names: failedModules,
    errors: failedModules.map(name => state.seen[name])
  };
};
exports.errors = errors;
const handleErrors = (state, options) => {
  const failedModules = errors(state).names;
  const failedModuleList = failedModules.map(v => `'${v}'`).join(', ');
  if (failedModules.length > 0 && options.error) {
    throw new Error(`Error loading dependencies(${failedModuleList})`);
  }
};
exports.handleErrors = handleErrors;
const collectDevAndDepModules = (pkg, state, entry) => {
  if (!state.modules) state.modules = {};
  state.modules[pkg.name] = entry.module;
  if (pkg.name === '@open-automaton/traverse-dependencies') {
    return {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
      ...(pkg.peerDependencies || {})
    };
  } else {
    return {
      ...(pkg.dependencies || {}),
      ...(pkg.peerDependencies || {})
    };
  }
};
exports.collectDevAndDepModules = collectDevAndDepModules;
const currentDirectoryImportMap = async name => {
  const result = await traverse('.', collectDevAndDepModules);
  return result.modules;
};
exports.currentDirectoryImportMap = currentDirectoryImportMap;