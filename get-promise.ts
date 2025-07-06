export function getPromise<TReturn>() {
    let resolve!: (value: TReturn) => void;
    let reject!: (value: Error) => void;
    let isPending: boolean = true;
    let isFulfilled: boolean = false;

    const promise = new Promise<TReturn>((res, rej) => {
        resolve = (value: TReturn) => {
            res(value);
            isPending = false;
            isFulfilled = true;
        };
        reject = (error: Error) => {
            rej(error);
            isPending = false;
            isFulfilled = true;
        }
    });

    return {
        resolve,
        reject,
        get isPending() {
            return isPending;
        },
        get isFulfilled() {
            return isFulfilled;
        },
        promise
    }
}