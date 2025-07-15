import {DependencyStream} from "../dependency-stream.ts";
import {getPromise} from "../../get-promise.ts";
import {IStreamOwner} from "../contracts.ts";
import {symAI} from "../../constants.ts";

export function onceStream<T>(dep: DependencyStream<T>): IStreamOwner<T> {
    const externalDispose = getPromise();
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