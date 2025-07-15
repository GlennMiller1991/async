import {raceStream, Dependency} from "../../../index";
import {Dispatch, SetStateAction, useEffect, useState} from "react";

class StreamController {
    setValue?: Dispatch<SetStateAction<any>>
    streams: Dependency[];
    iterator!: ReturnType<typeof raceStream>

    constructor(...streams: Dependency[]) {
        this.streams = streams;
        this.init()
    }

    async init() {
        this.iterator = raceStream(...this.streams);
        for await (let chunk of this.iterator) {
            console.log(chunk);
            this.setValue?.(chunk);
        }
    }

    dispose = () => {
        this.iterator?.dispose();
    }
}

export function useStream(...streams: Dependency[]) {

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

