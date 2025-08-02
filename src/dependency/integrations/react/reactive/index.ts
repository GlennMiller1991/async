import React, {ComponentProps, createElement, FunctionComponent, useEffect, useState} from "react";
import {observationState} from "../../../observe.state.ts";
import {usePromise} from "./utils.ts";

export function Reactive(fn: FunctionComponent) {
    return React.memo((props: ComponentProps<FunctionComponent>) => {
        const [key, setKey] = useState(Math.random());

        const abortPromise = usePromise();
        useEffect(() =>  abortPromise.resolve, [])

        observationState.isObserved = true;

        useEffect(() => {
            const deps = observationState.getDeps()!;
            observationState.isObserved = false;
            if (!deps.size) return;

            let prom: Promise<any>[] = [abortPromise.promise];
            deps.forEach(d => prom.push(d.next()));

            Promise.race(prom)
                .then(() => {
                    if (abortPromise.isFulfilled) return;
                    setKey(Math.random());
                })
        }, [key, props])
        return createElement(fn, props);
    })
}