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
        async function subscribe() {
            for await (const value of reaction(cachedFunction)) {
                reactionFn();
            }
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

        isDep1Ready.value = true;
        await iterateThrough();
        expect(reactionFn).toHaveBeenCalledTimes(1);

        isDep2Ready.value = true;
        await iterateThrough();
        expect(reactionFn).toHaveBeenCalledTimes(11);

        isDep1Ready.value = false;
        await iterateThrough();
        expect(reactionFn).toHaveBeenCalledTimes(12);


    })
})