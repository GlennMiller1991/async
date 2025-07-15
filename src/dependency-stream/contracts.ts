export interface IIteratorOwner<TValue = any> {
    value: TValue,
    dispose(): void,
}

export type IStreamReturn = void;

export interface IStreamIterator<TValue = any> {
    owner: IIteratorOwner<TValue>
    dispose(): void;
    readonly isDisposed: boolean;

    next(): Promise<IteratorResult<TValue, IStreamReturn>>
}

export interface IDependencyStream<TValue = any> {
    dispose(): void;
    readonly isDisposed: boolean;
    [Symbol.asyncIterator](): AsyncIterator<TValue,  IStreamReturn>
}



