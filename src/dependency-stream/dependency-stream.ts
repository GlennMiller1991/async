import {IIteratorOwner, IStreamIterator} from "./contracts.ts";
import {PromiseConfiguration} from "../get-promise.ts";

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
    withReactionOnSubscribe: boolean,
    externalDispose: PromiseConfiguration<any>,
}>

export class DependencyStream<T = any> implements IIteratorOwner<T> {
    private reactionPromise: undefined | PromiseConfiguration<T>;
    private abortPromise = new PromiseConfiguration();
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

    [Symbol.asyncIterator](this: DependencyStream<T>, thisStreamConfig: IThisStreamConfig = {}): IStreamIterator<T> {
        const totalDispose = this.abortPromise;
        const externalPromises: Promise<any>[] = [totalDispose.promise];
        let firstPromise: PromiseConfiguration<T> | undefined;
        const withReactionOnSubscribe = this.config.withReactionOnSubscribe || thisStreamConfig.withReactionOnSubscribe;

        if (withReactionOnSubscribe) {
            firstPromise = new PromiseConfiguration<T>();
            firstPromise.resolve(this.value);
            externalPromises.push(firstPromise.promise);
        }

        if (thisStreamConfig.externalDispose) {
            externalPromises.push(thisStreamConfig.externalDispose.promise);
        }

        let isDisposed = false;

        const owner = this;
        return {
            owner,
            dispose: owner.dispose.bind(owner),
            get isDisposed() {
                return isDisposed;
            },
            next: async () => {
                if (!this.reactionPromise) {
                    this.reactionPromise = new PromiseConfiguration();
                    this._set(this._value);
                }

                await Promise.race([
                    ...externalPromises,
                    this.reactionPromise.promise,
                ]);

                if (totalDispose.isFulfilled || thisStreamConfig.externalDispose?.isFulfilled) {
                    isDisposed = true;
                    return {done: true} as {done: true, value: void};
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
        this.abortPromise = new PromiseConfiguration();
        this.reactionPromise = undefined;
    }
}



