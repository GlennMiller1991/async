import {getPromise} from "./get-promise";

export function delay(ms: number = 0) {
    ms = Math.max(ms, 0);
    const {promise, resolve} = getPromise();
    setTimeout(() => {
        resolve();
    }, ms);

    return promise;
}