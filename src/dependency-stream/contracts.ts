export interface IIteratorOwner<TValue = any> {
    value: TValue,
    dispose(): void,
}

export type IStreamReturn = void;
export type IStreamIteratorReturn = IteratorReturnResult<IStreamReturn>;
export type IStreamIteratorYield<T> = IteratorYieldResult<T>;

export interface IStreamIterator<TValue = any> {
    owner: IIteratorOwner<TValue>
    dispose(): void;
    readonly isDisposed: boolean;

    next(): Promise<IteratorResult<TValue, IStreamReturn>>
}

export interface IStreamOwner<TValue = any> {
    dispose(): void;
    readonly isDisposed: boolean;
    [Symbol.asyncIterator](): AsyncIterator<TValue,  IStreamReturn>
}



