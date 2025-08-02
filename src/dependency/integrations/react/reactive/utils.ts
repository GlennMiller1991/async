import {useState} from "react";
import {PromiseConfiguration} from "../../../../promise-configuration.ts";

export function usePromise<T = void>() {
    const [promise] = useState(() => new PromiseConfiguration<T>());
    return promise;
}