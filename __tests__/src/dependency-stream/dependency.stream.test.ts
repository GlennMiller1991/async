import {delay, Dependency, DependencyStream} from "@src";
import {IJestMockFn} from "@utils";
import {getStream} from "../../../src/dependency/stream-utils/get.stream";

describe('DependencyStream', () => {
    type IStreamType = number;
    const initialValue: IStreamType = -1;
    let counter: Dependency<IStreamType>;
    let reactionFn: IJestMockFn;
    let exitFn: IJestMockFn;
    const qty = 10;
    async function iterateCounter() {
        for (let i = 0; i < qty; i++) {
            counter.value++;
            await delay();
        }
    }


    async function subscribe(stream: DependencyStream | Dependency = counter) {
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

    test('Dependency.getStream should work', async () => {
        const stream = getStream(counter);
        subscribe(stream);

        await iterateCounter();

        stream.dispose();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(qty);
        expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test('Cannot subscribe after dispose', async () => {
        const stream = getStream(counter);
        subscribe(stream);

        await iterateCounter();
        stream.dispose()
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(qty);
        expect(exitFn).toHaveBeenCalledTimes(1);

        subscribe(stream);
        await iterateCounter();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(qty);
        expect(exitFn).toHaveBeenCalledTimes(2);
    });
})