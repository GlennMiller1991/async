import {PromiseConfiguration} from "../promise-configuration.js";
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
    withReactionOnSubscribe: boolean,
}
export type IThisStreamConfig = Partial<{
    withReactionOnSubscribe: boolean,
    externalDispose: PromiseConfiguration<any>,
}>