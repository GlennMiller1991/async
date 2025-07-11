import {getPromise, IPromiseConfiguration} from "../utils";

interface IIsEquals<T> {
    (prev: T, cur: T): boolean;
}

function baseComparer<T>(prev: T, cur: T) {
    return prev === cur;
}

type IDependencyStreamConfig<T> = {
    withCustomEquality: IIsEquals<T>,
    withReactionOnSubscribe: boolean,
}

export class DependencyStream<T = any> {
    private reactionPromise: undefined | IPromiseConfiguration<T>;
    private abortPromise = getPromise();
    private config: IDependencyStreamConfig<T>;

    constructor(private _value: T, config: Partial<IDependencyStreamConfig<T>> = {}) {
        this.config = {
            withCustomEquality: baseComparer,
            withReactionOnSubscribe: false,
            ...config,
        };
    }

    private _set(v: T) {
        if (this.config.withCustomEquality(this._value, v)) {
            return;
        }
        this._value = v;
        if (this.reactionPromise) {
            this.reactionPromise.resolve(v);
            this.reactionPromise = undefined;
        }

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
        const externalPromises: Promise<any>[] = [totalDispose.promise, selfDispose.promise];
        let firstPromise: IPromiseConfiguration<T> | undefined;
        if (this.config.withReactionOnSubscribe) {
            firstPromise = getPromise<T>();
            firstPromise.resolve(this.value);
            externalPromises.push(firstPromise.promise);
        }

        const owner = this;
        return {
            owner,
            dispose: () => selfDispose.resolve(),
            next: async () => {
                if (!this.reactionPromise) {
                    this.reactionPromise = getPromise();
                    this._set(this._value);
                }

                await Promise.race([
                    ...externalPromises,
                    this.reactionPromise.promise,
                ]);

                if (totalDispose.isFulfilled || selfDispose.isFulfilled) {
                    return {done: true};
                }

                if (firstPromise) {
                    firstPromise = undefined;
                    externalPromises.pop();
                }

                return {
                    done: false,
                    get value() {
                        return owner.value;
                    }
                };
            }
        };
    }

    dispose(this: DependencyStream<T>) {
        this.abortPromise.resolve();
        this.abortPromise = getPromise();
        this.reactionPromise = undefined;
    }
}



