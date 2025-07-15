import {getPromise} from "./get-promise.ts";

export function delay(ms: number, syncKey: 'sync'): void;
export function delay(ms?: number): Promise<void>;
export function delay(ms: number = 0, syncKey?: 'sync') {
    ms = Math.max(ms, 0);
    return (delay as IDelay).methods[typeof syncKey as keyof IDelay['methods']]!(ms);
}

interface IDelay {
    (ms?: number): Promise<void> | void,
    methods: {
        string(ms: number): void,
        undefined(ms: number): Promise<void>
    }
}
Object.defineProperty(delay, 'methods', {
    value: {
        string: (ms: number) => {
            const start = performance.now();
            while(true) {
                if (performance.now() - start >= ms) {
                    return;
                }
            }
        },
        undefined: (ms: number) => {
            const {promise, resolve} = getPromise();
            setTimeout(() => {
                resolve();
            }, ms);

            return promise;
        }
    }
});