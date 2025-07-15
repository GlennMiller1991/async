import {DependencyStream} from "../dependency-stream.ts";
import {symAI} from "../../constants.ts";

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