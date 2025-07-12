export interface IIteratorOwner<TValue = any> {
    value: TValue,
    dispose(): void,
}

export interface IStream<TValue = any> {
    owner: IIteratorOwner<TValue>
    dispose(): void;
    readonly isDisposed: boolean;

    next(): Promise<IteratorResult<TValue, void>>
}