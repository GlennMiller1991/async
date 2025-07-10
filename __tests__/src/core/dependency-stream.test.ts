import {DependencyStream} from "../../../src";

describe('Dependency Stream', () => {
    type IStreamType = number;
    const initialValue: IStreamType = 1;
    let counter: DependencyStream<IStreamType>;
    beforeEach(() => {
        counter?.dispose();
        counter = new DependencyStream(initialValue);
    })
    test('Dependency Stream should be of defined type', () => {
        expect(counter).toBeInstanceOf(DependencyStream);
        expect(counter.get).toBeDefined();
        expect(counter.set).toBeDefined();
        expect(counter.dispose).toBeDefined();
        expect(counter[Symbol.asyncIterator]).toBeDefined();
    });

    test('Stream should store initial value', () => {
        let counter: DependencyStream;
        for (let init of [
            1, 'asdf', null, NaN, Symbol('test'),
            BigInt(10), {}, [], new Map(), new Set(),
            new DependencyStream(1), undefined
        ]) {
            counter = new DependencyStream(init);
            expect(counter.get()).toBe(init);
        }
    });
});