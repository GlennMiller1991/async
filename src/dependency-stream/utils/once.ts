import {DependencyStream} from "../dependency-stream";

export function once(dep: DependencyStream) {
    let isIterationWas = false;
    const iterator = dep[Symbol.asyncIterator]();
    return {
        [Symbol.asyncIterator]() {
            return {
                next: async () => {
                    if (isIterationWas) return {done: true};
                    return iterator.next();
                }
            }
        },
        dispose: iterator.dispose,
    }
}