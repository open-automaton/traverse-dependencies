@open-automaton/traverse-dependencies
=====================================
Sometimes you need to traverse the tree of dependencies to do some work, this lets you do that and can do it in a browser or on a server without compile

Usage
-----
If you want to traverse the dependency graph and mutate the state:

```js
import { traverse } from '@open-automaton/traverse-dependencies';
const result = await traverse('.', (pkg, state)=>{
    if(pkg.name === 'my-root-package-name'){
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
```

If you want to build an importmap from your `node_modules` directory, then:

```js
import { 
    currentDirectoryImportMap 
} from '@open-automaton/traverse-dependencies';
const importMap = await currentDirectoryImportMap(
    'my-root-package-name'
);
```

Testing
-------

Run the es module tests to test the root modules
```bash
npm run import-test
```
to run the same test inside the browser:

```bash
npm run browser-test
```
to run the same test headless in chrome:
```bash
npm run headless-browser-test
```

to run the same test inside docker:
```bash
npm run container-test
```

Run the commonjs tests against the `/dist` commonjs source (generated with the `build-commonjs` target).
```bash
npm run require-test
```

Development
-----------
All work is done in the .mjs files and will be transpiled on commit to commonjs and tested.

If the above tests pass, then attempt a commit which will generate .d.ts files alongside the `src` files and commonjs classes in `dist`

