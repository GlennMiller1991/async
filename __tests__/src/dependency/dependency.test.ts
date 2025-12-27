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

});

describe('Memory leaking tests', () => {
    test('Dependency holds no links after disposing', async () => {
        let dep = new Dependency(0);
        let refs: Array<WeakRef<any>> = [];


        async function watchDependency() {
            for await (let _ of dep) {
                let obj = {};
                refs.push(new WeakRef(obj));
            }
        }

        const completion = watchDependency();

        expect(refs[0]).toBe(undefined);
        dep.value++;

        await delay();
        expect(refs[0]).not.toBe(undefined);

        // Jest holds object link so cause prevents it from being collected
        // And there is no opportunity simultaneously to test and holding value before dispose and after it
        // Here and in other tests
        // expect(refs[0].deref()).not.toBe(undefined);

        dep.dispose();

        await completion;
        gc();
        await delay(100);

        expect(refs[0].deref()).toBe(undefined);
    });
    test('Observing dependency in cycle happens like usual async cycle. Full completion', async () => {
        let dep = new Dependency(0);
        let dependencyRefs: Array<WeakRef<any>> = [];
        let normalRefs: Array<WeakRef<any>> = [];


        async function runWatchDependency() {
            const completion = watchDependency();
            for (let i = 0; i < 10; i++) {
                await delay();
                dep.value++;
            }

            await delay();
            dep.dispose();

            return completion;

            async function watchDependency() {
                for await (let _ of dep) {
                    let obj = {};
                    dependencyRefs.push(new WeakRef(obj));
                }
            }
        }

        async function normalAsyncCycle() {
            for (let i = 0; i < 10; i++) {
                await delay();
                let obj = {};
                normalRefs.push(new WeakRef(obj));
            }
        }

        const normalCompletion = normalAsyncCycle();
        const watchCompletion = runWatchDependency();

        await Promise.all([normalCompletion, watchCompletion]);

        gc();
        await delay(100);

        expect(dependencyRefs.length).toBe(normalRefs.length);
        for (let i = 0; i < dependencyRefs.length; i++) {
            expect(dependencyRefs[i].deref()).toBe(normalRefs[i].deref());
        }


    });
    test('Observing dependency in cycle happens like usual async cycle. Partial completion', async () => {
        let dep = new Dependency(0);
        let dependencyRefs: Array<WeakRef<any>> = [];
        let normalRefs: Array<WeakRef<any>> = [];


        async function runWatchDependency() {
            const completion = watchDependency();
            for (let i = 0; i < 10; i++) {
                await delay();
                dep.value++;
            }

            // await delay();

            delay(1000).then(() => dep.dispose());

            return completion;

            async function watchDependency() {
                for await (let _ of dep) {
                    let obj = {};
                    dependencyRefs.push(new WeakRef(obj));
                }
            }
        }

        async function normalAsyncCycle() {
            for (let i = 0; i < 10; i++) {
                await delay();
                let obj = {};
                normalRefs.push(new WeakRef(obj));
            }


            await delay(1000);
        }

        const normalCompletion = normalAsyncCycle();
        const watchCompletion = runWatchDependency();
        const completion = Promise.all([normalCompletion, watchCompletion]);

        await delay(500);
        gc();
        await delay(100);


        // This tests working when no one promise have not been resolved yet
        // More over, all planning iterations of cycles have already been completed, but
        // resolving will happen approximately after 500ms or near
        expect(dependencyRefs.length).toBe(normalRefs.length);
        for (let i = 0; i < dependencyRefs.length; i++) {
            expect(dependencyRefs[i].deref()).toEqual(normalRefs[i].deref());
        }

        await completion;

    });
})