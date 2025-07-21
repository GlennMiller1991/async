import {delay, Dependency, raceStream} from "@src";

describe('Race stream', () => {
    test('race stream should work', async () => {
        let value = -1;
        const counter_num = new Dependency(value);
        const counter_str = new Dependency(String(value));
        const reactionFn = jest.fn();
        const exitFn = jest.fn();
        const rs = raceStream({number: counter_num, string: counter_str});

        async function subscribe() {
            for await (let value of rs) {
                reactionFn();
            }
            exitFn();
        }

        subscribe();

        for (let i = 0; i < 10; i++) {
            value++;
            counter_num.value = value;
            counter_str.value = String(value);
            await delay();
        }

        rs.dispose();
        await delay();

        expect(reactionFn).toHaveBeenCalledTimes(10);
        expect(exitFn).toHaveBeenCalledTimes(1);



    })
})