export interface IDebounce<TReturn extends any, TArgs extends Array<any>> {
    (...args: TArgs): TReturn,
    dispose(): void;
}

export function debounce<TReturn extends any, TArgs extends Array<any>>(fn: (...args: TArgs) => TReturn, ms: number = 0): IDebounce<TReturn, TArgs> {
    let id: any | undefined;
    function cancelPrevious() {
        id !== void 0 && clearTimeout(id);
    }
    ms = Math.max(ms, 0);

    const functionToReturn = ((...args: TArgs) => {
        cancelPrevious?.();
        id = setTimeout(() => {
            fn(...args);
            id = undefined;
        }, ms);
    }) as unknown as IDebounce<TReturn, TArgs>;

    functionToReturn.dispose = cancelPrevious;
    return functionToReturn;
}
