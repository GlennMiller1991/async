import {getPromise} from "../../src";

describe('getPromise', () => {
    let promiseConf: ReturnType<typeof getPromise>
    beforeEach(() => {
        promiseConf = getPromise();
    })

    test('getPromise should give result', () => {
        expect(promiseConf).toBeTruthy();
    })
})