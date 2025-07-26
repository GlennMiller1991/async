import {IAllStreamConfig, IStreamIterator, IThisStreamConfig} from "./contracts.ts";
import {PromiseConfiguration} from "../promise-configuration.ts";
import {DependencyStream} from "./dependency.stream.ts";
import {baseComparer} from "./utils.ts";
import {collectDep} from "./global.ts";

export class Dependency<T = any> {
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
        collectDep(this);
        return this._value;
    }

    getStream(this: Dependency<T>) {
        return new DependencyStream<T>(this)
    }

    [Symbol.asyncIterator](this: Dependency<T>, thisStreamConfig: IThisStreamConfig = {}): IStreamIterator<T> {
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
                this.reactionPromise = this.reactionPromise ?? new PromiseConfiguration();

                await Promise.race([
                    ...externalPromises,
                    this.reactionPromise.promise,
                ]);


                if (totalDispose.isFulfilled || thisStreamConfig.externalDispose?.isFulfilled) {
                    isDisposed = true;
                    return {done: true} as { done: true, value: void };
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



    private _race: Promise<void> | undefined;
     async next(ref: {done?: boolean} = {}) {
         const abortPromise = this.abortPromise;
         if (!this._race) {
             this.reactionPromise = this.reactionPromise ?? new PromiseConfiguration();
             this._race = Promise.race([
                 abortPromise.promise,
                 this.reactionPromise.promise,
             ]) as Promise<void>;
         }
         let race = this._race;
         await race;
         this._race = undefined;

        if (abortPromise.isFulfilled) {
            ref.done = true
            return {done: true} as {done: true, value?: never};
        }

        return {
            done: false,
            get value(): T {
                return this.value
            }
        }
    }

    dispose(this: Dependency<T>) {
        this.abortPromise.resolve();
        this.abortPromise = new PromiseConfiguration();
        this.reactionPromise = undefined;
    }
}