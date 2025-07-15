import {delay, Dependency, onceStream} from "@src";
import {IJestMockFn} from "@utils";
import {IDependencyStream} from "../../../../src/dependency-stream/contracts";

describe('Dependency stream. Once', () => {
    type IStreamType = number;
    const initialValue: IStreamType = 1;
    let counter: Dependency<IStreamType>;
    let reactionFn: IJestMockFn;
    let exitFn: IJestMockFn;
    let stream: IDependencyStream<IStreamType>
    async function subscribe(stream: Dependency | IDependencyStream = counter) {
        for await (let value of stream instanceof Dependency ? onceStream(stream) : stream) {
            reactionFn(value);
        }
        exitFn();
    }

    const qty = 10;
    function iterateSync() {
        for (let i = 0; i < qty; i++) {
            counter.value++;
        }
    }

    async function iterateAsync() {
        for (let i = 0; i < qty; i++) {
            counter.value++;
            await delay();
        }
    }

    beforeEach(() => {
        counter?.dispose();
        counter = new Dependency(initialValue);
        stream = onceStream(counter);
        reactionFn = jest.fn();
        exitFn = jest.fn();
    });

    test('once should work', async () => {
        subscribe();

        iterateSync();

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

        await iterateAsync();

        counter.dispose();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(qty);
        expect(exitFn).toHaveBeenCalledTimes(1);
        expect(onceReactionFn).toHaveBeenCalledTimes(1);
        expect(onceExitFn).toHaveBeenCalledTimes(1);
    });

    test('once should work with IAllStreamConfig.withReactionOnSubscribe', async () => {
       const counter = new Dependency(1, {withReactionOnSubscribe: true});

       subscribe(counter);

       await delay();
       expect(reactionFn).toHaveBeenCalledTimes(1);
       expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test('once should be disposed before first value setting', async () => {
        subscribe(stream);
        stream.dispose();
        await iterateAsync();

        await delay();
        expect(reactionFn).toHaveBeenCalledTimes(0);
        expect(exitFn).toHaveBeenCalledTimes(1);
    });

    test('once should not be able for subscribe after dispose', async () => {
        subscribe(stream);
        await iterateAsync();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(exitFn).toHaveBeenCalledTimes(1);

        subscribe(stream);
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(exitFn).toHaveBeenCalledTimes(2);
    });

    test('once should be disposed after disposing dependency itself', async () => {
        subscribe(stream);
        counter.dispose();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(0);
        expect(exitFn).toHaveBeenCalledTimes(1);
    });
})