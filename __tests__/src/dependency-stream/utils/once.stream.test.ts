import {delay, DependencyStream, onceStream} from "@src";
import {IJestMockFn} from "@utils";

describe('Dependency stream. Once', () => {
    type IStreamType = number;
    const initialValue: IStreamType = 1;
    let counter: DependencyStream<IStreamType>;
    let reactionFn: IJestMockFn;
    let exitFn: IJestMockFn;
    async function subscribe(stream: DependencyStream = counter) {
        for await (let value of onceStream(stream)) {
            reactionFn(value);
        }
        exitFn();
    }
    beforeEach(() => {
        counter?.dispose();
        counter = new DependencyStream(initialValue);
        reactionFn = jest.fn();
        exitFn = jest.fn();
    });

    test('once should work', async () => {
        subscribe();

        for (let i = 0; i < 10; i++) {
            counter.value++;
        }

        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(exitFn).toHaveBeenCalledTimes(1);
    })
})