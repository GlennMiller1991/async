import {delay, Dependency, reaction} from "@src";

describe('reaction', () => {
    test('reaction should work', async () => {
        let isDep1Ready = new Dependency(false);
        let isDep2Ready = new Dependency(false);
        let counter = new Dependency(0);
        let cachedFunction = () => {
            if (isDep1Ready.value && isDep2Ready.value) {
                return counter.value;
            }
            return undefined;
        }

        let reactionFn = jest.fn();
        let exitFn = jest.fn();
        async function subscribe() {
            for await (const value of reaction(cachedFunction)) {
                reactionFn();
            }
            exitFn();
        }

        async function iterateThrough() {
            for (let i = 0; i < 10; i++) {
                counter.value++;
                await delay();
            }
        }

        subscribe();

        await iterateThrough();

        expect(reactionFn).not.toHaveBeenCalled();
        expect(exitFn).not.toHaveBeenCalled();

        isDep1Ready.value = true;
        await iterateThrough();
        expect(reactionFn).not.toHaveBeenCalled();
        expect(exitFn).not.toHaveBeenCalled();

        isDep2Ready.value = true;
        await iterateThrough();
        expect(reactionFn).toHaveBeenCalledTimes(10);
        expect(exitFn).not.toHaveBeenCalled();

        isDep1Ready.value = false;
        await iterateThrough();
        expect(reactionFn).toHaveBeenCalledTimes(11);
        expect(exitFn).not.toHaveBeenCalled();

        isDep1Ready.dispose();
        isDep1Ready.value = true;
        await delay();
        expect(reactionFn).toHaveBeenCalledTimes(11);
        expect(exitFn).toHaveBeenCalledTimes(1);
    })
})