import {Dependency} from "../dependency.js";

export type IDepObjectArgument = {
    [key: string]: Dependency
}
export type IDepObjectReturn<T extends IDepObjectArgument> = {
    [Key in keyof T]: T[Key]['value'];
}