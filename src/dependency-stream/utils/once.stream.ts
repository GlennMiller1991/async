import {DependencyStream} from "../dependency-stream.ts";
import {PromiseConfiguration} from "../../promise-configuration.ts";
import {IDependencyStream} from "../contracts.ts";
import {symAI} from "../../constants.ts";

export function onceStream<T>(dep: DependencyStream<T>): IDependencyStream<T> {
    const externalDispose = new PromiseConfiguration();
    const iterator = dep[symAI]({externalDispose});

    function isDisposed() {
        return externalDispose.isFulfilled || iterator.isDisposed;
    }

    return {
        get isDisposed() {
            return isDisposed();
        },
        dispose: externalDispose.resolve,
        [symAI]() {
            return {
                next: async () => {
                    const result = await iterator.next();
                    if (!isDisposed()) externalDispose.resolve();
                    return result;
                }
            }
        },
    }
}