import {watchDeps} from "../global.ts";
import {symAI} from "../../constants.ts";

/**
 * @deprecated
 */
export function reaction<T>(fn: () => T) {
    return {
        [Symbol.asyncIterator]: () => {
            let {result, deps} = watchDeps(fn);
            return {
                next: async () => {
                    const dependencies = Array.from(deps);
                    const streams = dependencies.map(dep => dep[symAI]())
                    await Promise.race(streams.map(s => s.next()));

                    ({result, deps} = watchDeps(fn));

                    return {done: false, value: result}
                }
            }
        }
    }
}