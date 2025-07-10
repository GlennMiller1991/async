import {getPromise} from "../../../src";

describe('getPromise', () => {
    type IPromiseResult = 1;
    let promiseConf: ReturnType<typeof getPromise<IPromiseResult>>;
    beforeEach(() => {
        promiseConf = getPromise<IPromiseResult>();
    });

    test('getPromise should give result', () => {
        expect(promiseConf).toBeDefined();
        expect(promiseConf.promise).toBeDefined();
        expect(promiseConf.resolve).toBeDefined();
        expect(promiseConf.reject).toBeDefined();
        expect(promiseConf.isFulfilled).toBeDefined();
        expect(promiseConf.isPending).toBeDefined();
    });

    test('resolve should resolve Promise with given type', async () => {

        expect(promiseConf.isPending).toBeTruthy();
        expect(promiseConf.isFulfilled).toBeFalsy();

        promiseConf.promise.then((res) => {
            expect(res).toBe(1);
            expect(promiseConf.isPending).toBeFalsy();
            expect(promiseConf.isFulfilled).toBeTruthy();
        })

        promiseConf.resolve(1);
    })

});