import { isBrowser, isJsDom } from 'browser-or-node';
import * as mod from 'module';
import * as path from 'path';
let internalRequire = null;
if(typeof require !== 'undefined') internalRequire = require;
const ensureRequire = ()=> (!internalRequire) && (internalRequire = mod.createRequire(import.meta.url));
import { getPackage } from '@environment-safe/package';

const getCommonJS = (pkg, args={}, options={})=>{
    return options.prefix + ['node_modules', pkg.name, (
        (pkg.exports && pkg.exports['.'] && pkg.exports['.'].require)?
            pkg.exports['.'].require:
            ((
                (pkg.type === 'commonjs' || !pkg.type)  && 
                (pkg.commonjs  || pkg.main) 
            ) || pkg.commonjs || (args.r && pkg.main))
    )].join('/');
};

const getModule = (pkg, args={}, options={})=>{
    return (options.prefix||'') + ['node_modules', pkg.name, (
        (pkg.exports && pkg.exports['.'] && pkg.exports['.'].import)?
            pkg.exports['.'].import:
            ((
                pkg.type === 'module' && 
                (pkg.module  || pkg.main) 
            ) || pkg.module || (args.r && pkg.main))
    )].join('/');
};

const traversal = {}; 

traversal.recursive = async(name, resolve, handle, state={modules:{}})=>{
    const pkg = await getPackage(name);
    if(!pkg) throw new Error('could not load '+path.join(process.cwd(), 'package.json'));
    const dependencies = await handle(pkg, state, {
        commonjs: getCommonJS(pkg),
        module: getModule(pkg),
    });
    for(let lcv=0; lcv < dependencies.length; lcv++){
        traversal.recursive(dependencies[lcv], resolve, handle, state);
    }
    return state;
};

traversal.unrolled = async(name, resolve, handle, state={seen:{}, modules:{}})=>{
    const pkg = await getPackage(name);
    if(!pkg) throw new Error('could not load '+path.join(process.cwd(), 'package.json'));
    state.seen[pkg.name] = true;
    let moduleName = null;
    let module = null;
    let subpkg = null;
    let commonjs = null;
    state.seen[pkg.name] = true;
    let deps = await handle(pkg, state, {
        commonjs: getCommonJS(pkg),
        module: getModule(pkg),
    });
    let list = Object.keys(deps);
    while(list.length){
        moduleName = list.shift();
        if(state.seen[moduleName]) continue;
        let thisPath = null;
        try{
            thisPath = await resolve(moduleName);
            let localPath = thisPath;
            if(!(isBrowser || isJsDom)){ //todo: bake into resolve?
                const parts = thisPath.split(`/${moduleName}/`);
                parts.pop();
                const joined =  parts.join(`/${moduleName}/`);
                localPath = joined?joined + `/${moduleName}/`:`${moduleName}/`;
            }
            subpkg = await getPackage(localPath);
            let dependencies = [];
            if(!subpkg){
                state.seen[moduleName] = new Error(
                    `Could load '${localPath}' package.json`
                );
            }else{
                state.seen[moduleName] = true;
                commonjs = getCommonJS(subpkg);
                module = getModule(subpkg);
                dependencies = await handle(subpkg, state, {
                    commonjs,
                    module
                });
            }
            state.seen[moduleName] = true;
            Object.keys(dependencies || {}).forEach((dep)=>{
                if(list.indexOf(dep) === -1 && !state.seen[dep]){
                    list.push(dep);
                }
            });
        }catch(ex){
            state.seen[moduleName] = new Error(`Could not find ${moduleName}`);
        }
    }
    return state;
};

const universalResolve = (name)=>{
    if(isBrowser || isJsDom){
        const resolution = `/node_modules/${name}`;
        return resolution;
    }else{
        if(!internalRequire) ensureRequire();
        return internalRequire.resolve(`${name}`);
    }
};

export const traverse = (name, handle)=>{
    return traverse.unrolled(name, universalResolve, handle);
};
traverse.unrolled = traversal.unrolled;
traverse.recursive = traversal.recursive;

export const errors = (state)=>{
    const keys = Object.keys(state.seen);
    const failedModules = keys.filter( v => state.seen[v] instanceof Error );
    return {
        names: failedModules,
        errors: failedModules.map(name=>state.seen[name])
    };
};

export const handleErrors = (state, options)=>{
    const failedModules = errors(state).names;
    const failedModuleList = failedModules
        .map(v=>`'${v}'`)
        .join(', ');
    if(failedModules.length > 0 && options.error){
        throw new Error(`Error loading dependencies(${failedModuleList})`);
    }
};

export const collectDevAndDepModules = (pkg, state, entry)=>{
    if(!state.modules) state.modules = {};
    state.modules[pkg.name] = entry.module;
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
};

export const currentDirectoryImportMap = async (name)=>{
    const result = await traverse('.', collectDevAndDepModules);
    return result.modules;
};