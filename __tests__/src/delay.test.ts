import {delay} from "../../src";

describe("delay", () => {
    test('sync', async () => {
        const start = Date.now();
        const value = 10;
        const res = delay(value, 'sync');
        expect(Date.now() - start).toBeGreaterThanOrEqual(value);
        expect(res).toBeUndefined();
    });

    test('async', async () => {
        const start = Date.now();
        const value = 1;
        const promise = delay(value);
        await promise;
        expect(Date.now() - start).toBeGreaterThanOrEqual(value);
        expect(promise).toBeDefined();
    })
})