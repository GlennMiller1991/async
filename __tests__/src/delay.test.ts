import {delay} from "@src";

describe("delay", () => {
    test('sync', async () => {
        const start = performance.now();
        const value = 10;
        const res = delay(value, 'sync');
        expect(performance.now() - start).toBeGreaterThanOrEqual(value);
        expect(res).toBeUndefined();
    });

    test('async', async () => {
        const start = performance.now();
        const value = 10;
        const promise = delay(value);
        await promise;
        expect(performance.now() - start).toBeGreaterThanOrEqual(value);
        expect(promise).toBeDefined();
    })
})