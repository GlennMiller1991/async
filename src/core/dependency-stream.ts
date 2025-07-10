import {getPromise} from "../utils";

export class DependencyStream<T = any> {
    private promiseConf: undefined | ReturnType<typeof getPromise<T>>;
    private abortPromise = getPromise();

    constructor(private _value: T) {

    }

    private _set(v: T) {
        if (v === this._value) return;
        this._value = v;
        this.promiseConf && this.promiseConf.resolve(v);
    }

    set value(v: T) {
        this._set(v);
    }

    get value() {
        return this._value;
    }

    [Symbol.asyncIterator](this: DependencyStream<T>) {
        const totalDispose = this.abortPromise;
        const selfDispose = getPromise();
        return {
            owner: this,
            dispose: () => selfDispose.resolve(),
            next: async () => {
                if (!this.promiseConf) {
                    this.promiseConf = getPromise();
                    this._set(this._value);
                }

                await Promise.race([
                    totalDispose.promise,
                    selfDispose.promise,
                    this.promiseConf.promise,
                ]);
                this.promiseConf = undefined;
                if (totalDispose.isFulfilled || selfDispose.isFulfilled) {
                    return {done: true};
                }

                const value = this.value;
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
        this.abortPromise.resolve();
        this.abortPromise = getPromise();
    }
}



