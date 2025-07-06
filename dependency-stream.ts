import {getPromise} from "./get-promise";

enum ReactionType {
    Once,
    Always,
}

type IDependencyStreamConfig = {
    type: ReactionType,
}

export class DependencyStream<T> {
    private abortKey = Symbol('abort');
    private promise: undefined | ReturnType<typeof getPromise<T>>;
    private abortPromise = getPromise<typeof this.abortKey>();

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
        const selfDispose = getPromise<typeof this.abortKey>();
        const obj = {
            owner: this,
            dispose: () => {
                selfDispose.resolve(this.abortKey)
            },
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

    stream() {
        const iterator = this[Symbol.asyncIterator]({type: ReactionType.Always});
        return {
            owner: this,
            [Symbol.asyncIterator]: () => iterator,
            dispose: iterator.dispose,
        }
    }

    once() {
        const iterator = this[Symbol.asyncIterator]({type: ReactionType.Once});
        return {
            [Symbol.asyncIterator]: () => iterator,
            dispose: iterator.dispose,
        }
    }

    dispose() {
        this.abortPromise.resolve(this.abortKey);
        this.abortPromise = getPromise();
    }

    static any(...deps: DependencyStream<any>[]) {
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
}



