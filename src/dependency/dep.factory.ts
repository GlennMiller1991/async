import {Dependency} from "./dependency.ts";
import {IAllStreamConfig} from "./contracts.ts";
import {reaction} from "./vanilla/index.ts";
import {getStream} from "./vanilla/get.stream.ts";

export abstract class DepFactory {
    static ofValue<T>(value: T, config?: Partial<IAllStreamConfig<T>>) {
        return new Dependency(value, config);
    }  
    
    static ofReaction<T>(fn: () => T, config?: Partial<IAllStreamConfig<T>>) {
        return reaction(fn, config);
    }

    static ofDependency<T>(dep: Dependency<T>) {
        return getStream<T>(dep);
    }
}