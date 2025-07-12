import {getPromise, IPromiseConfiguration} from "../get-promise";

interface IIsEquals<T> {
    (prev: T, cur: T): boolean;
}

function baseComparer<T>(prev: T, cur: T) {
    return prev === cur;
}

type IAllStreamConfig<T> = {
    withCustomEquality: IIsEquals<T>,
    withReactionOnSubscribe: boolean,
}

type IThisStreamConfig = Partial<{
    withReactionOnSubscribe: boolean
}>

export class DependencyStream<T = any> {
    private reactionPromise: undefined | IPromiseConfiguration<T>;
    private abortPromise = getPromise();
    private config: IAllStreamConfig<T>;

    constructor(private _value: T, config: Partial<IAllStreamConfig<T>> = {}) {
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

    [Symbol.asyncIterator](this: DependencyStream<T>, thisStreamConfig: IThisStreamConfig = {}) {
        const totalDispose = this.abortPromise;
        const selfDispose = getPromise();
        const externalPromises: Promise<any>[] = [totalDispose.promise, selfDispose.promise];
        let firstPromise: IPromiseConfiguration<T> | undefined;
        if (this.config.withReactionOnSubscribe || thisStreamConfig.withReactionOnSubscribe) {
            firstPromise = getPromise<T>();
            firstPromise.resolve(this.value);
            externalPromises.push(firstPromise.promise);
        };
        let isDisposed = false;

        const owner = this;
        return {
            owner,
            dispose: () => selfDispose.resolve(),
            get isDisposed() {
                return isDisposed;
            },
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
                    isDisposed = true;
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



