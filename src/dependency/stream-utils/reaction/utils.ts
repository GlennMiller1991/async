import {observationState} from "../../observe.state.ts";

export function runFnWithDepCollection<T>(fn: () => T) {
    observationState.isObserved = true;
    const result = fn();
    const deps = observationState.getDeps()!;
    observationState.isObserved = false;
    return {
        result, deps
    }
}