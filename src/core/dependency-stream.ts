import {getPromise} from "../utils";

export class DependencyStream<T = any> {
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

    [Symbol.asyncIterator](this: DependencyStream<T>) {
        const totalDispose = this.abortPromise;
        const selfDispose = getPromise<undefined>();
        return {
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

                const value = this.get();
                return {
                    done: false,
                    get value() {
                        return value;
                    }
                };
            }
        };
    }

    dispose(this: DependencyStream<T>) {
        this.abortPromise.resolve(undefined);
        this.abortPromise = getPromise();
    }
}



