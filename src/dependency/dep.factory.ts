import {Dependency} from "./dependency.ts";
import {IAllStreamConfig} from "./contracts.ts";
import {reaction} from "./vanilla/index.ts";

export abstract class DepFactory {
    static ofValue<T>(value: T, config?: Partial<IAllStreamConfig<T>>) {
        return new Dependency(value, config);
    }  
    
    static ofReaction<T>(fn: () => T, config?: Partial<IAllStreamConfig<T>>) {
        return reaction(fn, config)
    }
}