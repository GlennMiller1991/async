import React, {createElement, FunctionComponent, useEffect, useState} from "react";
import {PromiseConfiguration} from "../../../../promise-configuration.ts";
import {Dependency} from "../../../dependency.ts";
import {observationState} from "../../../observe.state.ts";

let currentWatch = {
    watching: false,
    deps: null as null | Set<Dependency>
}

const watchStack: Array<typeof currentWatch> = [];

function usePromise<T = void>() {
    const [promise] = useState(() => new PromiseConfiguration<T>());
    return promise;
}

function Reactive(fn: FunctionComponent) {
    // const dep = DepFactory.ofReaction(fn);
    // ref.current = dep;
    // const value = dep.value;
    return React.memo(() => {
        const [key, setKey] = useState(Math.random());

        const abortPromise = usePromise();
        useEffect(() =>  abortPromise.resolve, [])

        observationState.isObserved = true;
        if (currentWatch.watching) {
            watchStack.push(currentWatch);
            currentWatch = {
                watching: true,
                deps: null,
            }
        } else {
            currentWatch.watching = true
        }

        useEffect(() => {
            const deps = observationState.getDeps()!;
            observationState.isObserved = false;
            if (!deps.size) return;


            let prom: Promise<any>[] = [
                abortPromise.promise,
            ];
            deps.forEach((d, i) => {
                prom.push(d.next());
            })

            Promise.race(prom)
                .then(() => {
                    if (abortPromise.isFulfilled) return;

                    setKey(Math.random());
                })
        }, [key])
        return createElement(fn);
    })
}