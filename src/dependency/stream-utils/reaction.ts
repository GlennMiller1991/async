import {runFnWithDepCollection} from "../global.ts";
import {Dependency} from "../dependency.js";

/**
 * @deprecated
 */
export function reaction<T>(fn: () => T) {
    return {
        [Symbol.asyncIterator]: () => {
            let {result, deps} = runFnWithDepCollection(fn);
            let depsArray: Array<Dependency>;
            let beforeValues: Array<any>;
            let obj = {
                next: async (): Promise<{done: true, value?: never} | {done: false, value: T}> => {
                    depsArray = Array.from(deps);
                    beforeValues = depsArray.map(dep => dep.value);

                    await Promise.race(depsArray.map(dep => dep.next()));
                    let shouldRun = depsArray.some((dep, i) => dep.value !== beforeValues[i]);

                    if (shouldRun) {
                        ({result, deps} = runFnWithDepCollection(fn));
                        return {done: false, value: result};
                    } else {
                        for (let dep of deps) {
                            if (dep.done) deps.delete(dep);
                        }
                        if (!deps.size) return {done: true} as {done: true, value?: never};
                        return obj.next()
                    }
                }
            }

            return obj;
        }
    }
}