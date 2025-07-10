import {DependencyStream} from "./dependency-stream";

export function stream(dep: DependencyStream) {
    return dep[Symbol.asyncIterator]();
}

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

export function anyStream(...deps: DependencyStream[]) {
    const streams = deps.map((dep) => stream(dep));
    let disposed = false;
    return {
        dispose: () => {
            streams.map(s => s.dispose());
            disposed = true;
        },
        [Symbol.asyncIterator]() {
            return {
                next: async () => {

                    await Promise.race(streams.map(s => s.next()));
                    if (disposed) {
                        return {done: true};
                    }
                    return {done: false, value: streams.map(s => s.owner.get())};
                }
            }
        }
    };
}