import {getPromise} from "../utils/index.js";

enum ReactionType {
    Once,
    Always,
}

type IDependencyStreamConfig = {
    type: ReactionType,
}

export class DependencyStream<T> {
    private promise: undefined | ReturnType<typeof getPromise<T>>;
    private abortPromise = getPromise<undefined>();

    constructor(private _value: T) {

    }

    private _set(v: T) {
        if (v === this._value) return;
        this._value = v;
        this.promise && this.promise.resolve(v);
    }

    set = (v: T) => {
        this._set(v);
    }

    get() {
        return this._value;
    }

    private [Symbol.asyncIterator](conf: IDependencyStreamConfig) {
        const totalDispose = this.abortPromise;
        const selfDispose = getPromise<undefined>();
        const obj = {
            owner: this,
            dispose: () => selfDispose.resolve(undefined),
            next: async () => {
                if (!this.promise) {
                    this.promise = getPromise();
                    this._set(this._value);
                }

                await Promise.race([
                    totalDispose.promise,
                    selfDispose.promise,
                    this.promise.promise,
                ]);
                this.promise = undefined;
                if (totalDispose.isFulfilled || selfDispose.isFulfilled) {
                    return {done: true};
                }

                conf.type === ReactionType.Once && obj.dispose();

                const value = this.get();
                return {
                    done: false,
                    get value() {
                        return value;
                    }
                };
            }
        };
        return obj;
    }

    stream(this: DependencyStream<T>) {
        const iterator = this[Symbol.asyncIterator]({type: ReactionType.Always});
        return {
            owner: this,
            [Symbol.asyncIterator]: () => iterator,
            dispose: iterator.dispose,
        }
    }

    once(this: DependencyStream<T>) {
        const iterator = this[Symbol.asyncIterator]({type: ReactionType.Once});
        return {
            [Symbol.asyncIterator]: () => iterator,
            dispose: iterator.dispose,
        }
    }

    dispose(this: DependencyStream<T>) {
        this.abortPromise.resolve(undefined);
        this.abortPromise = getPromise();
    }
}



