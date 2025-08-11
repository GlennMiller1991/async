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
        // all tested node versions in all tested OS periodically
        // executes timeout callbacks earlier than expected
        expect(performance.now() - start).toBeGreaterThanOrEqual(value - 1);
        expect(promise).toBeDefined();
    })
})