# Async tools
Tree-shakable ES module with async tools.

## Installation
You can install this package with your favorite package manager.<br/>
Npm, for example, will be looks like:
```npm i @fbltd/async```

## Overview

### delay
delay is a function that can be executed synchronous or asynchronous.
The behaviour depends on passed arguments:
```typescript
// Returns a promise - asynchrounous running in a non-blocking manner;
await delay(number);

// Returns nothing - synchrounous running in a blocking manner;
delay(number, 'sync');
```

### PromiseConfiguration
PromiseConfiguration is a class that creates and provide promise, 
its fulfillment functions and status flags.
Instance of the class is represented by the following type:
```typescript
type IPromiseConfiguration<T> = {
    readonly resolve: (arg: T) => void, // function that resolves promise
    readonly reject: (err: Error) => void, // function that rejects promise
    readonly promise: Promise<T>,        // promise itself
    readonly isPending: boolean, // promise status flag
    readonly isFulfilled: boolean, // reverted promise status flag
} 
```
There is no any management of passed data for resolving.
Returned promise is usual ES promise so it is impossible to fulfill promise twice.

### DependencyStream
#### core
Implementation of reactive model leveraging native JavaScript async features like
Promises, (async) iterators and generators.
The version is 0.0.x so keep it in mind

```typescript
const counter = new DependencyStream<number>(0);

async function onCounterChange() {
    for await (let value of counter) {
        // do whatever you want
    }

    // here we going in case of disposing counter (counter.dispose)
    // or stream itself (counter.stream().dispose)
}

onCounterChange();

let i = 0;
setInterval(() => {
    for (let k = 0; k < 10; k++) {
        // The counter detects changes when the first new value 
        // differs from the previous one. 
        // Subsequent value updates are collected and processed together
        // during the next microtask execution phase of the event loop.
        counter.value = i++;
    }
}, 1000)
```

#### Stream utils
##### onceStream
##### raceStream
##### next

##### reaction
The most powerful util among all stream utils.
Function is watching only for actual dependencies and does not react
for dependencies that do not affect result value:
```typescript
let isDep1Ready = new Dependency(false);
let isDep2Ready = new Dependency(false);
let counter = new Dependency(0);

// function that implicityly uses dependency instances
let cachedFunction = () => {
    if (isDep1Ready.value && isDep2Ready.value) {
        return counter.value;
    }
    return undefined;
}

async function subscribe() {
    for await (const value of reaction(cachedFunction)) {
        reactionFn();
    }
    exitFn();
}
```
The reaction is declared deprecated because a return value caching does not
use optimal strategy. Moreover, ideally, reaction should give back a 
dependency instance or something like it, that can provide an ability
to be an observable for another reaction.

#### Framework integrations
##### React
Of course, there is a React integration via stream hooks.
For example, here is classic react counter implementation via useRaceStream hook.

```typescript jsx
type IController = {
    dependecy: Dependency,
}
export const Counter: React.FC<ITest> = React.memo(({
                                                        dependency,
                                                    }) => {
    // num is an instance of DependencyStream
    const {value, dispose} = useRaceStream({dependency});

    // resolving promises on component unmounting
    // This is won't cause of rerender
    useEffect(() => dispose, [])

    return (
        <div className={"container"}>
            <button className={"incrementer"}
                // Now result is array of streams values
                // It should be object
                    onClick={() => dependency.value++}>
                +
            </button>

            <div className={cn("display")}>
                {
                    // Now result is array of streams values
                    // It should be object                    
                }
                {value.dependency}
            </div>
        </div>
    )
})
```