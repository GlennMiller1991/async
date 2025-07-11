import {getPromise} from "./get-promise";

export function delay(ms: number, sync: true): void;
export function delay(ms?: number): Promise<void>;
export function delay(ms: number = 0, sync?: true) {
    ms = Math.max(ms, 0);
    return (delay as IDelay).methods[typeof sync as keyof IDelay['methods']]!(ms);
}

interface IDelay {
    (ms?: number): Promise<void> | void,
    methods: {
        boolean(ms: number): void,
        undefined(ms: number): Promise<void>
    }
}
Object.defineProperty(delay, 'methods', {
    value: {
        boolean: (ms: number) => {
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