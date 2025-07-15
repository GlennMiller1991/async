import {Dependency} from "../dependency.ts";
import {IDependencyStream} from "../contracts.ts";
import {symAI} from "../../constants.ts";

export function onceStream<T>(dep: Dependency<T>): IDependencyStream<T> {
    const stream = dep.getStream();
    const iterator = stream[symAI]();
    return {
        get isDisposed() {
            return stream.isDisposed;
        },
        dispose: () => stream.dispose(),
        [symAI]() {
            return {
                next: async () => {
                    const result = await iterator.next();
                    if (!result.done) stream.dispose()
                    return result;
                }
            }
        },
    }
}