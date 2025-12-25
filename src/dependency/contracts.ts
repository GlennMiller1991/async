import {Dependency} from "./dependency.ts";

export interface IStreamIterator<TValue = any> {
    owner: Dependency
    dispose(): void;
    readonly isDisposed: boolean;

    next(): Promise<IteratorResult<TValue, void>>
}

export interface IDependencyStream<TValue = any> {
    dispose(): void;
    readonly isDisposed: boolean;
    [Symbol.asyncIterator](): AsyncIterator<TValue,  void>
}


export interface IIsEquals<T> {
    (prev: T, cur: T): boolean;
}

export type IAllStreamConfig<T> = {
    withCustomEquality: IIsEquals<T>,
    /**
     * Reaction happens anyway right after current task
     * wherever dependency was disposed
     */
    withReactionOnSubscribe: boolean,
}
export type IThisStreamConfig = Partial<{
    /**
     * Reaction happens right after current task
     * wherever dependency itself was disposed, but
     * stream dispose has priority over first reaction
     */
    withReactionOnSubscribe: boolean,
}>