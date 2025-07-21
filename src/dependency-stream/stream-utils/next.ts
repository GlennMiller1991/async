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
    dep[symAI]({externalDispose: disposePromise})
        .next()
        .then((res) => {
            if (res.done) resultPromise.reject(StreamFinishError);
            else resultPromise.resolve(res.value);
        });

    return {
        promise: resultPromise.promise,
        dispose: () => disposePromise.resolve()
    };
}
