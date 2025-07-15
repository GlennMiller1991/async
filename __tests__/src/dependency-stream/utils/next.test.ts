import {delay, Dependency, next} from "@src";

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
        let promise = next(counter);

        iterateSync();

        await promise;
        expect(await promise).toBeDefined();

        iterateAsync(10);
        promise = next(counter);

        expect(await promise).toBeDefined();
    })
})