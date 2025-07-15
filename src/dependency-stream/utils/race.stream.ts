import {Dependency} from "../dependency.ts";
import {symAI} from "../../constants.ts";
import {PromiseConfiguration} from "../../promise-configuration.ts";

export function raceStream<TArray extends Dependency[]>(...deps: NoInfer<TArray>) {
    let selfDisposePromise = new PromiseConfiguration<{done: true, value: void}>();
    let isDisposed = false;
    const streams = deps.map((dep) => dep[symAI]({
        externalDispose: selfDisposePromise
    }));
    return {
        dispose: () => selfDisposePromise.resolve({done: true, value: void 0}),
        get isDisposed() {
          return isDisposed;
        },
        [symAI]() {
            return {
                next: async () => {
                    const res = await Promise.race([selfDisposePromise.promise, ...streams.map(s => s.next())]);
                    if (res.done) return res;
                    return {done: false, value: streams.map(s => s.owner.value)};
                }
            }
        }
    };
}