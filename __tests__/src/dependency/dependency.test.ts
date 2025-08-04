import {delay, Dependency, PromiseConfiguration} from "@src";
import {IJestMockFn} from "@utils";

describe('Dependency', () => {
    type IStreamType = number;
    const initialValue: IStreamType = 1;
    let counter: Dependency<IStreamType>;
    let reactionFn: IJestMockFn;
    let exitFn: IJestMockFn;

    async function subscribe(stream: Dependency = counter) {
        for await (let value of stream) {
            reactionFn(value);
        }
        exitFn();
    }

    beforeEach(() => {
        counter?.dispose();
        counter = new Dependency(initialValue);
        reactionFn = jest.fn();
        exitFn = jest.fn();
    });
    test('Dependency Stream should be of defined type', () => {
        expect(counter).toBeInstanceOf(Dependency);
        expect(counter.value).toBeDefined();
        expect(counter.value).toBeDefined();
        expect(counter.dispose).toBeDefined();
        expect(counter[Symbol.asyncIterator]).toBeDefined();
    });

    test('Stream should store initial value', () => {
        let counter: Dependency;
        for (let init of [
            1, 'asdf', null, NaN, Symbol('test'),
            BigInt(10), {}, [], new Map(), new Set(),
            new Dependency(1), undefined
        ]) {
            counter = new Dependency(init);
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

        const objectStream = new Dependency(initial, {withCustomEquality: isEqual});

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
        const counter = new Dependency(0, {withReactionOnSubscribe: true});

        subscribe(counter);
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(1);
        counter.dispose();
        await delay();
        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(exitFn).toHaveBeenCalledTimes(1);

    });

    test('Dispose has priority over value change trigger', async () => {
        subscribe();

        counter.value = Math.random();
        counter.dispose();

        // reaction will be at the next microtask
        expect(reactionFn).not.toHaveBeenCalled();
        expect(exitFn).toHaveBeenCalledTimes(0);

        await delay();
        expect(reactionFn).not.toHaveBeenCalled();
        expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test('Multiple subscribers', async () => {
        const subQty = 2;
        for (let i = 0; i < subQty; i++) {
            subscribe();
        }
        const qty = 10;
        for (let i = 0; i < qty; i++) {
            counter.value++;
            await delay();
        }

        counter.dispose();
        expect(reactionFn).toHaveBeenCalledTimes(subQty * qty);

        expect(exitFn).toHaveBeenCalledTimes(0);
        await delay();
        expect(exitFn).toHaveBeenCalledTimes(subQty);
    });

    test('Subscriber can dispose stream', async () => {
        async function subscribe() {
            for await (let value of counter) {
                counter.dispose();
                reactionFn();
            }
            exitFn();
        }

        subscribe();
        counter.value++;

        await delay();
        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test(`There is no cyclic error on dispose within reaction.
                 Any subscriber can dispose stream, but all reaction should finish work`,
        async () => {
            let idThatDispose = 3;
            let qty = 10;

            async function subscribe(id: number) {
                for await (let value of counter) {
                    if (id === idThatDispose) {
                        counter.dispose();
                    }
                    reactionFn();
                }
                exitFn();
            }

            for (let i = 0; i < qty; i++) {
                subscribe(i + 1);
            }

            counter.value++;
            await delay();
            expect(reactionFn).toHaveBeenCalledTimes(qty);
            expect(exitFn).toHaveBeenCalledTimes(qty)
        });

    test('External dispose should work', async () => {
        const disposePromise = new PromiseConfiguration();
        const iterator = counter[Symbol.asyncIterator]({
            externalDispose: disposePromise,
        })

        async function subscribe() {
            while (!(await iterator.next()).done) {
                reactionFn();
            }
            exitFn();
        }

        subscribe();

        let qty = 10;
        for (let i = 0; i < qty; i++) {
            counter.value++;
            await delay();
        }

        disposePromise.resolve();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(qty);
        expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test('External dispose should not cease work of other subscribers', async () => {
        const disposePromise = new PromiseConfiguration();
        const iterator = counter[Symbol.asyncIterator]({
            externalDispose: disposePromise,
        })

        async function diposeSubscriber() {
            while (!(await iterator.next()).done) {
                reactionFn();
            }
            exitFn();
        }

        let subQty = 9;
        diposeSubscriber();
        for (let i = 0; i < subQty; i++) {
            subscribe();
        }

        let qty = 10;
        for (let i = 0; i < qty; i++) {
            counter.value++;
            await delay();
        }

        disposePromise.resolve();
        await delay();
        expect(reactionFn).toHaveBeenCalledTimes((subQty + 1) * qty);
        expect(exitFn).toHaveBeenCalledTimes(1);

        counter.dispose();
        await delay();
        expect(exitFn).toHaveBeenCalledTimes(subQty + 1);
    });
});