import {runFnWithDepCollection} from "../global.ts";

/**
 * @deprecated
 */
export function reaction<T>(fn: () => T) {
    const ref = {done: false};
    return {
        [Symbol.asyncIterator]: () => {
            let {result, deps} = runFnWithDepCollection(fn);
            return {
                next: async () => {
                    await Promise
                        .race(Array
                            .from(deps)
                            .map(dep => dep.next(ref))
                        );
                    if (ref.done) return ref as {done: true, value?: never};

                    ({result, deps} = runFnWithDepCollection(fn));

                    return {done: false, value: result}
                }
            }
        }
    }
}