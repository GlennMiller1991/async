import {Dependency} from "../dependency.ts";
import {symAI} from "../../constants.ts";
import {PromiseConfiguration} from "../../promise-configuration.ts";

/**
 * @internal
 */
export const StreamFinishError = new Error("Stream is done");

export function next<T>(dep: Dependency<T>) {
    const disposePromise = new PromiseConfiguration();
    const resultPromise = new PromiseConfiguration<T>();
    Promise.race([dep.next(), disposePromise.promise])
        .then((res) => {
            if (dep.done || disposePromise.isFulfilled) {
                resultPromise.reject(StreamFinishError);
            } else {
                resultPromise.resolve(dep.value);
            }
        })

    return {
        promise: resultPromise.promise,
        dispose: () => disposePromise.resolve()
    };
}
