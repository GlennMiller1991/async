import {PromiseConfiguration} from "../promise-configuration.ts";
import {IDependencyStream, IStreamIterator} from "./contracts.ts";
import {symAI} from "../constants.ts";
import {Dependency} from "./dependency.ts";

export class DependencyStream<T = any> implements IDependencyStream {
    private abortPromise = new PromiseConfiguration();
    private readonly iterator: IStreamIterator<T>;

    get isDisposed() {
        return this.iterator.isDisposed;
    }

    get done() {
        return this.owner.done || !this.abortPromise?.isPending;
    }

    constructor(public readonly owner: Dependency) {
        this.abortPromise = new PromiseConfiguration();
        this.iterator = owner[symAI]();
    }

    [symAI]() {
        const done = {done: true} as { done: true, value: void };
        return {
            next: async () => {
                if (this.done) {
                    this.abort();
                    return done;
                }

                const nextRes = this.iterator.next();

                await Promise.race([
                    this.abortPromise.promise,
                    nextRes,
                ]);

                if (this.done) {
                    this.abort();
                    return done;
                }

                this.abortPromise = new PromiseConfiguration();

                return nextRes;
            }
        }
    }

    protected abort() {
        if (this.abortPromise?.isPending) {
            this.abortPromise.resolve();
            this.abortPromise = undefined as any;
        }
    }

    dispose() {
        if (this.done) return;
        this.abort();
    }


}