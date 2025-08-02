import React, {
    FunctionComponent,
    NamedExoticComponent,
    useEffect,
    useState
} from "react";
import {observationState} from "../../../observe.state.ts";
import {usePromise} from "./utils.ts";

export function Reactive<P extends object>(fn: FunctionComponent<P>): NamedExoticComponent<P> {
    return React.memo((props) => {
        const [key, setKey] = useState(false);
        const abortPromise = usePromise();
        useEffect(() => abortPromise.resolve, []);
        observationState.isObserved = true;
        const jsx = fn(props);
        const deps = observationState.getDeps()!;
        observationState.isObserved = false;
        if (deps.size) {
            let prom: Promise<any>[] = [abortPromise.promise];
            deps.forEach(d => prom.push(d.next()));
            Promise.race(prom)
                .then(() => {
                    if (abortPromise.isFulfilled)
                        return;
                    setKey(!key);
                });
        }

        return jsx;
    });
}