import {DependencyStream} from "../dependency-stream";
import {symAI} from "../../constants";
import {getPromise} from "../../get-promise";

export function raceStream<TArray extends DependencyStream[]>(...deps: NoInfer<TArray>) {
    const streams = deps.map((dep) => dep[symAI]());
    let selfDisposePromise = getPromise();
    let isDisposed = false;
    return {
        dispose: selfDisposePromise.resolve,
        get isDisposed() {
          return isDisposed;
        },
        [symAI]() {
            return {
                next: async () => {
                    await Promise.race([selfDisposePromise.promise, streams.map(s => s.next())]);
                    if (selfDisposePromise.isFulfilled || streams.some(s => s.isDisposed)) {
                        isDisposed = true;
                        return {done: true};
                    }
                    return {done: false, value: streams.map(s => s.owner.value)};
                }
            }
        }
    };
}