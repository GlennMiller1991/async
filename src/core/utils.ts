import {DependencyStream} from "./dependency-stream.js";

export function anyStream(...deps: DependencyStream<any>[]) {
    const streams = deps.map((dep) => dep.stream()[Symbol.asyncIterator]());
    let disposed = false;
    return {
        dispose: () => {
            streams.map(s => s.dispose());
            disposed = true;
        },
        [Symbol.asyncIterator]() {
            return {
                next: async () => {

                    await Promise.any(streams.map(s => s.next()));
                    if (disposed) {
                        return {done: true};
                    }
                    return {done: false, value: streams.map(s => s.owner.get())};
                }
            }
        }
    };
}