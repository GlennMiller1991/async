import {symAI} from "../../constants.ts";
import {PromiseConfiguration} from "../../promise-configuration.ts";
import {IDependencyStream, IStreamIterator} from "../contracts.js";
import {IDepObjectArgument, IDepObjectReturn} from "./contracts.js";

export function raceStream<T extends IDepObjectArgument>(deps: T): IDependencyStream<IDepObjectReturn<T>> {
    let externalDispose = new PromiseConfiguration<{ done: true, value: void }>();
    const [keys, streams] = Object
        .entries(deps)
        .reduce((acc, [key, dep]) => {
            acc[0].push(key);
            acc[1].push(dep[symAI]({externalDispose}));
            return acc;
        }, [[] as string[], [] as IStreamIterator[]])

    function isDisposed() {
        return streams.some((s) => s.isDisposed);
    }

    return {
        dispose: () => !isDisposed() && externalDispose.resolve({done: true, value: void 0}),
        get isDisposed() {
            return isDisposed();
        },
        [symAI]() {
            return {
                next: async () => {
                    const res = await Promise.race(streams.map(s => s.next()));
                    if (res.done) {
                        return res;
                    }

                    const value = keys.reduce((acc, key) => {
                        acc[key as keyof T] = deps[key as keyof T].value;
                        return acc;
                    }, {} as Partial<IDepObjectReturn<T>>) as IDepObjectReturn<T>

                    return {done: false, value};
                }
            }
        }
    };
}