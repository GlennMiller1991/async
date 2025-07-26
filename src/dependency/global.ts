import {Dependency} from "./dependency.js";

const global = {
    watchFlag: false as boolean,
    dependencies: null as unknown as Set<Dependency>
}

const notImplemented = new Error('Watching while watching is not implemented');
export function runFnWithDepCollection<T>(fn: () => T): {result: T, deps: typeof global.dependencies} {
    if (global.watchFlag) {
        throw notImplemented;
    }

    global.watchFlag = true;
    global.dependencies = new Set();
    let result = fn();
    let deps = global.dependencies;
    global.dependencies = null as any;
    global.watchFlag = false;
    return {
        result, deps
    }
}

export function collectDep(dep: Dependency) {
    if (!global.watchFlag) return;
    global.dependencies.add(dep);
}
