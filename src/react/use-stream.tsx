import {DependencyStream} from "../core/dependency-stream";
import {Dispatch, SetStateAction, useEffect, useState} from "react";

class StreamController {
    setValue?: Dispatch<SetStateAction<any>>
    streams: DependencyStream<any>[];
    iterator: ReturnType<typeof anyStream>

    constructor(...streams: DependencyStream<any>[]) {
        this.streams = streams;
        this.init()
    }

    async init() {
        this.iterator = anyStream(...this.streams);
        for await (let chunk of this.iterator) {
            console.log(chunk);
            this.setValue?.(chunk);
        }
    }

    dispose = () => {
        this.iterator?.dispose();
    }
}

export function useStream(...streams: DependencyStream<any>[]) {

    const [value, setValue] = useState(streams.map(s => s.get()));
    const [controller] = useState(() => new StreamController(...streams))

    controller.setValue = setValue;

    useEffect(() => () => controller.dispose(), []);

    return {
        value,
        dispose: controller.dispose,
    } as {
        value: Array<any> | undefined,
        dispose: () => void,
    }
}

