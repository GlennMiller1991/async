import {debounce} from "../../src/debounce";
import {delay} from "@src";

describe('debounce', () => {
    test('should work once', async () => {
        const jestFn = jest.fn();
        const f = debounce(jestFn);
        for (let i = 0; i < 100; i++) {
            f();
        }
        expect(jestFn).toHaveBeenCalledTimes(0);
        await delay(100);
        expect(jestFn).toHaveBeenCalledTimes(1);
    });

    test('should be disposable if execution planned', async () => {
        const jestFn = jest.fn();
        const f = debounce(jestFn, 100);
        f();
        f.dispose();
        await delay(150);
        expect(jestFn).toHaveBeenCalledTimes(0);

        f();
        f.dispose();
        await delay(50);
        expect(jestFn).toHaveBeenCalledTimes(0);
    })
})