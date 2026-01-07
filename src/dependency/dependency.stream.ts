import {PromiseConfiguration} from "../promise-configuration.ts";
import {IAllStreamConfig, IDependencyStream, IStreamIterator} from "./contracts.ts";
import {symAI} from "../constants.ts";
import {Dependency} from "./dependency.ts";
import {baseComparer} from "./utils.js";

export class DependencyStream<T = any> implements IDependencyStream {
    private abortPromise = new PromiseConfiguration();
    private readonly iterator: IStreamIterator<T>;
    private config: IAllStreamConfig<T>;

    get isDisposed() {
        return this.iterator.isDisposed;
    }

    get done() {
        return this.owner.done || !this.abortPromise?.isPending;
    }

    constructor(public readonly owner: Dependency, config: Partial<IAllStreamConfig<T>> = {}) {
        this.abortPromise = new PromiseConfiguration();
        this.iterator = owner[symAI]();

        this.config = {
            withCustomEquality: baseComparer,
            withReactionOnSubscribe: false,
            ...config,
        };
    }

    [symAI]() {
        const done = {done: true} as { done: true, value: void };

        const externalPromises: Promise<any>[] = [];
        let firstPromise: Promise<void> | undefined;
        const withReactionOnSubscribe = this.config.withReactionOnSubscribe;

        if (withReactionOnSubscribe) {
            firstPromise = Promise.resolve();
            externalPromises.push(firstPromise);
        }

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
                    ...externalPromises,
                ]);

                if (firstPromise) {
                    firstPromise = undefined;
                    externalPromises.pop();
                }

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