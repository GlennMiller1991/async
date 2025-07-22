import {delay, Dependency, raceStream} from "@src";
import {IDependencyStream} from "../../../../src/dependency-stream/contracts";
import {IJestMockFn} from "@utils";

describe('Race stream', () => {
    let initialValue = -1;
    let counter_num: Dependency<number>;
    let counter_str: Dependency<string>;
    let rs: IDependencyStream<{ string: string, number: number }>;
    let reactionFn: IJestMockFn;
    let exitFn: IJestMockFn;

    async function subscribe() {
        for await (let value of rs) {
            reactionFn();
        }
        exitFn();
    }

    beforeEach(() => {
        initialValue = -1;
        counter_num = new Dependency(initialValue);
        counter_str = new Dependency(String(initialValue));
        reactionFn = jest.fn();
        exitFn = jest.fn();
        rs = raceStream({number: counter_num, string: counter_str});
    });

    test('race stream should work', async () => {
        subscribe();

        for (let i = 0; i < 10; i++) {
            initialValue++;
            counter_num.value = initialValue;
            counter_str.value = String(initialValue);
            await delay();
        }

        rs.dispose();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(10);
        expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test('should work once on all changes within current microtask', async () => {
        subscribe();
        for (let i = 0; i < 10; i++) {
            initialValue++;
            counter_num.value = initialValue;
            counter_str.value = String(initialValue);
        }

        await delay();
        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(exitFn).toHaveBeenCalledTimes(0);

        rs.dispose();
        await delay();
        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test('should be disposed on dispose one of dependencies', async () => {
        subscribe();

        counter_num.dispose();
        await delay();
        expect(reactionFn).toHaveBeenCalledTimes(0);
        expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test('should react on change of one of dependencies', async () => {
        subscribe();

        for (let i = 0; i < 10; i++) {
            counter_num.value++;
            await delay();
        }

        rs.dispose();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(10);
        expect(exitFn).toHaveBeenCalledTimes(1);
    })
})