import {DependencyStream} from "../dependency-stream";
import {symAI} from "../../constants";

const StreamFinishError = new Error("Stream is done");

export async function next<T>(dep: DependencyStream<T>) {
    const res = await dep[symAI]().next();
    if (res.done) {
        throw StreamFinishError;
    }
    return res.value;
}

/**
 * @internal
 */
export const InternalStreamFinishError = StreamFinishError;