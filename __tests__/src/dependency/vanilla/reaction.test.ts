import {delay, Dependency, reaction} from "@src";
import {IJestMockFn} from "@utils";

describe('reaction', () => {
    let isDep1Ready: Dependency<boolean>;
    let isDep2Ready: Dependency<boolean>;
    let counter: Dependency<number>;
    let reactionFn: IJestMockFn;
    let exitFn: IJestMockFn;
    let workFn: IJestMockFn;
    let reactionDep: Dependency;
    async function subscribe() {
        for await (const value of reactionDep = reaction(subscriber)) {
            reactionFn();
        }
        exitFn();
    }
    function subscriber() {
        workFn();
        if (isDep1Ready.value && isDep2Ready.value) {
            return counter.value;
        }
        return undefined;
    }
    beforeEach(() => {
         isDep1Ready = new Dependency(false);
         isDep2Ready = new Dependency(false);
         counter = new Dependency(0);
         reactionFn = jest.fn();
         exitFn = jest.fn();
         workFn = jest.fn();
    });
    test('reaction should work', async () => {
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
    });
    test('reaction should work once on changed in current task', async () => {
        subscribe();

        expect(workFn).toHaveBeenCalledTimes(1);
        expect(reactionFn).toHaveBeenCalledTimes(0);

        for (let i = 0; i < 11; i++) {
            isDep1Ready.value = !isDep1Ready.value;
            isDep2Ready.value = !isDep2Ready.value;
            counter.value++;
        }

        await delay();
        expect(isDep1Ready.value).toBe(true);
        expect(isDep2Ready.value).toBe(true);
        expect(reactionFn).toHaveBeenCalledTimes(1);
        expect(workFn).toHaveBeenCalledTimes(2);

        isDep1Ready.dispose();
        isDep2Ready.dispose();
        counter.dispose();
    });
    test('reaction should be disposed on dispose all current deps', async () => {
        subscribe();
        expect(reactionDep.done).toBeFalsy();

        isDep1Ready.dispose();
        await delay();
        expect(reactionDep.done).toBeTruthy();
    });
    test('reaction should not be disposed on dispose on of deps', async () => {
        subscribe();

        isDep2Ready.value = isDep1Ready.value = true;
        await delay();
        isDep1Ready.dispose();
        await delay();
        expect(reactionDep.done).toBeFalsy();

        isDep2Ready.dispose();
        await delay();
        expect(reactionDep.done).toBeFalsy();

        counter.dispose();
        await delay();
        expect(reactionDep.done).toBeTruthy();
        expect(exitFn).toHaveBeenCalledTimes(1);
    });
    test('reaction should be disposed on dispose dep itself', async () => {
        subscribe();
        expect(exitFn).toHaveBeenCalledTimes(0);
        reactionDep.dispose();
        await delay();
        expect(exitFn).toHaveBeenCalledTimes(1);
    });
})