import {getPromise} from "../utils";

interface ICompareFn<T> {
    (prev: T, cur: T): boolean;
}

function baseComparer<T>(prev: T, cur: T) {
    return prev === cur;
}

type IDependencyStreamConfig<T> = {
    isEqual: ICompareFn<T>
}

export class DependencyStream<T = any> {
    private promiseConf: undefined | ReturnType<typeof getPromise<T>>;
    private abortPromise = getPromise();
    private config: IDependencyStreamConfig<T>;

    constructor(private _value: T, config: Partial<IDependencyStreamConfig<T>> = {}) {
        this.config = {
            isEqual: baseComparer,
            ...config,
        };
    }

    private _set(v: T, force?: boolean) {
        if (!force) {
            if (this.config.isEqual(this._value, v)) {
                return;
            }
        }
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



