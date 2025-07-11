import {delay} from "../../../src/utils/delay";

describe("delay", () => {
    test('sync', () => {
        const start = Date.now();
        const value = 1;
        const res = delay(value, true);
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