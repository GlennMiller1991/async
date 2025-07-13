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
    });

    test('once should not dispose other streams', async () => {
        const onceReactionFn = jest.fn();
        const onceExitFn = jest.fn();

        async function onceSubscribe() {
            for await (let value of onceStream(counter)) {
                onceReactionFn();
            }
            onceExitFn();
        }

        async function subscribe() {
            for await (let value of counter) {
                reactionFn();
            }
            exitFn();
        }

        onceSubscribe();
        subscribe();

        const qty = 10;
        for (let i = 0; i < qty; i++) {
            counter.value++;
            await delay();
        }

        counter.dispose();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(qty);
        expect(exitFn).toHaveBeenCalledTimes(1);
        expect(onceReactionFn).toHaveBeenCalledTimes(1);
        expect(onceExitFn).toHaveBeenCalledTimes(1);
    });

    test('once should work with IAllStreamConfig.withReactionOnSubscribe', async () => {
       const counter = new DependencyStream(1, {withReactionOnSubscribe: true});

       subscribe(counter);

       await delay();
       expect(reactionFn).toHaveBeenCalledTimes(1);
       expect(exitFn).toHaveBeenCalledTimes(1);
    });
})