import {Dependency} from "../dependency.ts";
import {symAI} from "../../constants.ts";
import {PromiseConfiguration} from "../../promise-configuration.ts";
import {IDependencyStream} from "../contracts.js";

type IDepObjectArgument = {
    [key: string]: Dependency
}

type IDepObjectReturn<T extends IDepObjectArgument> = {
    [Key in keyof T]: T[Key]['value'];
}

export function raceStream<T extends IDepObjectArgument>(deps: T): IDependencyStream<IDepObjectReturn<T>> {
    let selfDisposePromise = new PromiseConfiguration<{ done: true, value: void }>();
    let isDisposed = false;
    const keys = Object.keys(deps);
    const streams = keys.map((key) => deps[key][symAI]());
    return {
        dispose: () => !isDisposed && selfDisposePromise.resolve({done: true, value: void 0}),
        get isDisposed() {
            return isDisposed;
        },
        [symAI]() {
            return {
                next: async () => {
                    const res = await Promise.race([selfDisposePromise.promise, ...streams.map(s => s.next())]);
                    if (res.done) {
                        isDisposed = true;
                        return res;
                    }
                    const value: Partial<IDepObjectReturn<T>> = {};
                    keys.forEach((key) => {
                        value[key as keyof T] = deps[key as keyof T].value
                    })
                    return {done: false, value};
                }
            }
        }
    };
}