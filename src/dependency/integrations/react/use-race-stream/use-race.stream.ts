import {IDepObjectArgument, IDepObjectReturn} from "../../../index.ts";
import {useEffect, useState} from "react";
import {RaceStreamController} from "./race-stream.controller.ts";

export function useRaceStream<T extends IDepObjectArgument>(deps: T): {
    value: IDepObjectReturn<T>,
    dispose: Function
} {

    const [obj] = useState<{
        controller?: RaceStreamController<T>
    }>(() => ({controller: new RaceStreamController(deps)}))
    const [, setValue] = useState(false);

    obj.controller!.rerenderTrigger = setValue;

    useEffect(() => {
        return () => {
            obj.controller!.dispose();
            obj.controller = undefined;
        }
    }, []);

    return {
        value: obj.controller!.value,
        dispose: obj.controller!.dispose,
    } as {
        value: IDepObjectReturn<T>,
        dispose: () => void,
    }
}