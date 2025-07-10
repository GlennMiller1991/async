import {DependencyStream} from "../../../src";
import {delay} from "../../../src/utils/delay";

describe('Dependency Stream', () => {
    type IStreamType = number;
    const initialValue: IStreamType = 1;
    let counter: DependencyStream<IStreamType>;
    beforeEach(() => {
        counter?.dispose();
        counter = new DependencyStream(initialValue);
    })
    test('Dependency Stream should be of defined type', () => {
        expect(counter).toBeInstanceOf(DependencyStream);
        expect(counter.value).toBeDefined();
        expect(counter.value).toBeDefined();
        expect(counter.dispose).toBeDefined();
        expect(counter[Symbol.asyncIterator]).toBeDefined();
    });

    test('Stream should store initial value', () => {
        let counter: DependencyStream;
        for (let init of [
            1, 'asdf', null, NaN, Symbol('test'),
            BigInt(10), {}, [], new Map(), new Set(),
            new DependencyStream(1), undefined
        ]) {
            counter = new DependencyStream(init);
            expect(counter.value).toBe(init);
        }
    });

    test('Stream should work once on value sync changes', async () => {
        const fn = jest.fn();
        async function subscribe() {
            for await (let value of counter) {
                fn(value)
            }
        }

        const promise = subscribe();
        let i = 0;
        for (i; i < 10; i++) {
            counter.value = i;
        }

        await delay(0);
        counter.dispose();

        await promise;
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(i - 1);
    });
});