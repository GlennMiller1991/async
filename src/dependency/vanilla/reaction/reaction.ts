import {Dependency} from "../../dependency.ts";
import {symAI} from "../../../constants.ts";
import {IAllStreamConfig} from "../../contracts.ts";
import {runFnWithDepCollection} from './utils.ts';
import {observationState} from "../../observe.state.ts";

export function reaction<T>(fn: () => T, config?: Partial<IAllStreamConfig<T>>) {
    let {result, deps} = runFnWithDepCollection(fn);

    const dep = new Dependency<T>(result, config);

    async function subscribe() {
        const stream = {[symAI]: () => {
            let depsArray: Array<Dependency>;
            let beforeValues: Array<any>;
            let obj = {
                next: async (): Promise<{done: true, value?: never} | {done: false, value: T}> => {
                    depsArray = Array.from(deps);

                    observationState.suspend();
                    beforeValues = depsArray.map(dep => dep.value);
                    const promises = depsArray.map(dep => dep.next());
                    promises.push(dep.disposePromise as Promise<any>);
                    observationState.cancelSuspense()

                    await Promise.race(depsArray.map(dep => dep.next()));
                    if (dep.done) return {done: true};

                    observationState.suspend();
                    let shouldRun = depsArray.some((dep, i) => dep.value !== beforeValues[i]);
                    observationState.cancelSuspense();

                    if (shouldRun) {
                        ({result, deps} = runFnWithDepCollection(fn));
                        return {done: false, value: result};
                    } else {
                        for (let dep of deps) {
                            if (dep.done) deps.delete(dep);
                        }
                        if (!deps.size) return {done: true} as {done: true, value?: never};
                        return obj.next()
                    }
                }
            }

            return obj;
        }};

        for await (let value of stream) {
            dep.value = value;
        }
    }

    subscribe().then(() => dep.dispose());

    return dep;
}

