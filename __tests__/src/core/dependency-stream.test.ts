import {DependencyStream} from "../../../src";
import {delay} from "../../../src/utils/delay";

describe('Dependency Stream', () => {
    type IStreamType = number;
    const initialValue: IStreamType = 1;
    let counter: DependencyStream<IStreamType>;
    let reactionFn: ReturnType<typeof jest.fn>;
    let exitFn: ReturnType<typeof jest.fn>;

    async function subscribe(stream: DependencyStream<any> = counter) {
        for await (let value of stream) {
            reactionFn(value);
        }
        exitFn();
    }

    beforeEach(() => {
        counter?.dispose();
        counter = new DependencyStream(initialValue);
        reactionFn = jest.fn();
        exitFn = jest.fn();
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
        const promise = subscribe();
        let i = 0;
        for (i; i < 10; i++) {
            counter.value = i;
        }

        await delay(0);
        counter.dispose();

        await promise;
        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(reactionFn).toHaveBeenCalledWith(i - 1);
    });

    test('Stream should exit on sync dispose', async () => {
        const promise = subscribe();
        let i = 0;
        for (i; i < 10; i++) {
            counter.value = i;
        }
        counter.dispose();

        await promise;
        expect(reactionFn).not.toHaveBeenCalled();
        expect(exitFn).toHaveBeenCalledTimes(1);

    });

    test('Stream should work once at each task time', async () => {
        const outerQty = 10;
        const innerQty = 10;
        let valueHaveBeenChangedTimes = 0;
        counter.value = -1;

        async function run() {
            for (let i = 0; i < outerQty; i++) {
                for (let k = 0; k < innerQty; k++) {
                    counter.value += 1;
                    valueHaveBeenChangedTimes++;
                }
                await delay();
            }

            counter.dispose();
        }

        const promise = subscribe();
        run();
        await promise;

        expect(valueHaveBeenChangedTimes).toEqual(outerQty * innerQty);
        expect(reactionFn).toHaveBeenCalledTimes(outerQty);
        expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test('Compare function should not to allow reaction trigger', async () => {
        const initial = {
            string: '0',
            counter: 0,
        }

        function isEqual(a: typeof initial, b: typeof a) {
            return a.string === b.string && a.counter === b.counter;
        }

        const objectStream = new DependencyStream(initial, {withCustomEquality: isEqual});

        const outerQty = 10;
        const innerQty = 10;
        let valueHaveBeenChangedTimes = 0;
        let valueHaveBeenSettledTimes = 0;

        async function run() {
            for (let i = 0; i < outerQty; i++) {
                for (let k = 0; k < innerQty; k++) {
                    valueHaveBeenSettledTimes++;
                    valueHaveBeenChangedTimes++;

                    objectStream.value = {...objectStream.value};
                }
                await delay();
            }

            objectStream.dispose();
        }

        let promise = subscribe(objectStream);
        run();
        await promise;
        expect(reactionFn).toHaveBeenCalledTimes(0);
        expect(exitFn).toHaveBeenCalledTimes(1);

    });

    test('Reaction on subscribe', async () => {
        const counter = new DependencyStream(0, {withReactionOnSubscribe: true});

        subscribe(counter);
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(1);
        counter.dispose();
        await delay();
        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(exitFn).toHaveBeenCalledTimes(1);

    });
});