import {PromiseConfiguration} from "@src";

describe('getPromise', () => {
    type IPromiseResult = 1;
    const error = new Error('promise rejecting');
    let promiseConf: PromiseConfiguration<IPromiseResult>;
    beforeEach(() => {
        promiseConf = new PromiseConfiguration<IPromiseResult>();
    });

    test('getPromise should give result', () => {
        expect(promiseConf).toBeDefined();
        expect(promiseConf.promise).toBeDefined();
        expect(promiseConf.resolve).toBeDefined();
        expect(promiseConf.reject).toBeDefined();
        expect(promiseConf.isFulfilled).toBeDefined();
        expect(promiseConf.isPending).toBeDefined();

        expect(promiseConf.isPending).toBeTruthy();
        expect(promiseConf.isFulfilled).toBeFalsy();
    });

    test('resolve should resolve Promise with given type', async () => {
        promiseConf.promise.then((res) => {
            expect(res).toBe(1);
            expect(promiseConf.isPending).toBeFalsy();
            expect(promiseConf.isFulfilled).toBeTruthy();
        })

        promiseConf.resolve(1);
    });

    test('reject should rejecting Promise with error', async () => {
        promiseConf.promise.catch((res) => {
            expect(res).toBe(error);
            expect(promiseConf.isPending).toBeFalsy();
            expect(promiseConf.isFulfilled).toBeTruthy();
        })

        promiseConf.reject(error);
    })

});