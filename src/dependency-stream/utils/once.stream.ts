import {DependencyStream} from "../dependency-stream";
import {getPromise} from "../../get-promise";
import {IStreamOwner} from "../contracts";
import {symAI} from "../../constants";

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