import {IAllStreamConfig, IStreamIterator, IThisStreamConfig} from "./contracts.ts";
import {PromiseConfiguration} from "../promise-configuration.ts";
import {baseComparer} from "./utils.ts";
import {symAI} from "../constants.ts";
import {observationState} from "./observe.state.ts";

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
        if (this.done) return;
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
        observationState.setDep(this);
        return this._value;
    }

    get value_unsafe() {
        return this._value;
    }

    get done() {
        return !this.abortPromise || this.abortPromise.isFulfilled;
    }

    [symAI](this: Dependency<T>, thisStreamConfig: IThisStreamConfig = {}): IStreamIterator<T> {
        const externalPromises: Promise<any>[] = [];
        let firstPromise: Promise<void> | undefined;
        const withReactionOnSubscribe = this.config.withReactionOnSubscribe || thisStreamConfig.withReactionOnSubscribe;

        if (withReactionOnSubscribe) {
            firstPromise = Promise.resolve();
            externalPromises.push(firstPromise);
        }

        const owner = this;
        return {
            owner,
            dispose: owner.dispose.bind(owner),
            get isDisposed() {
                return owner.done;
            },
            next: async () => {
                 await Promise.race([
                     owner.next(),
                    ...externalPromises,
                ]);

                if (firstPromise) {
                    firstPromise = undefined;
                    externalPromises.pop();
                }

                if (this.done) {
                    return {done: true} as { done: true, value: void };
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

    /**
     * One race of value change and dependency dispose
     * for all subscribers
     */
    private _race: Promise<void> | undefined;

    private getOrCreateRace() {
        if (!this._race) {
            this.reactionPromise = this.reactionPromise ?? new PromiseConfiguration();
            this._race = Promise.race([
                this.abortPromise.promise,
                this.reactionPromise.promise,
            ]) as Promise<void>;
        }
        return this._race;
    }

    /**
     * Another subscribe for current race
     */
    async next() {
        const done = {done: true} as { done: true, value: void };
        const owner = this;

        if (this.done) return done;
        await this.getOrCreateRace();

        this._race = undefined;

        if (this.done) return done;

        this.abortPromise = new PromiseConfiguration();

        return {
            done: false,
            get value(): T {
                return owner.value;
            }
        }
    }

    get disposePromise() {
        return this.abortPromise?.promise ?? Promise.resolve();
    }

    dispose(this: Dependency<T>) {
        this.abortPromise?.resolve();
        this.abortPromise = this.reactionPromise = undefined as any;
    }
}