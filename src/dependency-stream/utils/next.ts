import {DependencyStream} from "../dependency-stream";
import {symAI} from "../../constants";

export async function next<T>(dep: DependencyStream<T>) {
    return (await dep[symAI]().next()).value;
}