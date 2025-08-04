import {DependencyStream} from "../dependency.stream.ts";
import {Dependency} from "../dependency.ts";

export function getStream<T>(dep: Dependency<T>) {
    return new DependencyStream<T>(dep)
}