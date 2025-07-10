import {anyStream, DependencyStream} from "../../core";
import {Dispatch, SetStateAction, useEffect, useState} from "react";

class StreamController {
    setValue?: Dispatch<SetStateAction<any>>
    streams: DependencyStream[];
    iterator!: ReturnType<typeof anyStream>

    constructor(...streams: DependencyStream[]) {
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

export function useStream(...streams: DependencyStream[]) {

    const [value, setValue] = useState(streams.map(s => s.value));
    const [obj] = useState<{controller?: StreamController}>(() => ({controller: new StreamController(...streams)}))

    obj.controller!.setValue = setValue;

    useEffect(() => {
        return () => {
            obj.controller!.dispose();
            obj.controller = undefined;
        }
    }, []);

    return {
        value,
        dispose: obj.controller!.dispose,
    } as {
        value: Array<any> | undefined,
        dispose: () => void,
    }
}

