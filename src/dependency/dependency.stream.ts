import {PromiseConfiguration} from "../promise-configuration.ts";
import {IDependencyStream, IStreamIterator} from "./contracts.ts";
import {symAI} from "../constants.ts";
import {Dependency} from "./dependency.ts";

export class DependencyStream<T = any> implements IDependencyStream {
    private selfDispose = new PromiseConfiguration();
    private readonly iterator: IStreamIterator<T>;

    get isDisposed() {
        return this.iterator.isDisposed;
    }

    constructor(public readonly owner: Dependency) {
        this.selfDispose = new PromiseConfiguration();
        this.iterator = owner[symAI]();
    }

    [symAI]() {
        const done = {done: true} as {done: true, value: void};
        return {
            next: async () => {
                if (this.selfDispose.isFulfilled) return done;

                const nextRes = this.iterator.next();

                await Promise.race([
                    this.selfDispose.promise,
                    nextRes,
                ]);

                if (this.selfDispose.isFulfilled) return done;

                this.selfDispose = new PromiseConfiguration();

                return nextRes;
            }
        }
    }

    dispose() {
        if (this.isDisposed) return;
        this.selfDispose.resolve();
    }


}