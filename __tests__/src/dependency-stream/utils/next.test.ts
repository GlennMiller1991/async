import {delay, Dependency, next, StreamFinishError} from "@src";

describe('next util', () => {
    type IValueType = number;
    const initialValue = -1;
    let counter: Dependency<IValueType>;

    const qty = 10;

    function iterateSync() {
        for (let i = 0; i < qty; i++) {
            counter.value++;
        }
    }

    async function iterateAsync(interval: number = 0) {
        for (let i = 0; i < qty; i++) {
            counter.value++;
            await delay(interval);
        }
    }

    beforeEach(() => {
        counter = new Dependency(initialValue);
    })
    test('next should work', async () => {
        let promise = next(counter).promise;

        iterateSync();

        await promise;
        expect(await promise).toBeDefined();

        iterateAsync(10);
        promise = next(counter).promise;

        expect(await promise).toBeDefined();
    });

    test('next should be disposable by itself and dependency', async () => {
        let promise: Promise<any>;
        let dispose: Function;

        let disposeFn = [
            () => dispose(),
            () => {
                counter.value++;
                dispose();
            },
            () => counter.dispose(),
            () => {
                counter.value++;
                counter.dispose();
            }
        ]

        for (let fn of disposeFn) {
            let temp = next(counter);
            promise = temp.promise;
            dispose = temp.dispose;
            fn();

            let isErrorThatWas: Error | undefined;
            try {
                await promise;
            } catch (err) {
                isErrorThatWas = err;
            }

            expect(isErrorThatWas).toBeDefined();
            expect(isErrorThatWas).toBe(StreamFinishError);
        }
    });
})