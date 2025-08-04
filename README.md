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

### debounce
debounce is a function that passed function after waiting for the passed time
without another function calls
```typescript
const myFunc = () => console.log('debounced running');
const debounced = debounce(myFunc, 100);

debounced();
debounced();
// after 100ms there will be only one console.log
// debounced running
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

### Dependency
Implementation of reactive model leveraging native JavaScript async features like
Promises, (async) iterators and generators.
The version is 0.0.x so keep it in mind

```typescript
const counter = new Dependency<number>(0);

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
for dependencies that do not affect result value. Since the reaction
provides dependency instance, of course, there is a function result caching:
```typescript
let isDep1Ready = new Dependency(false);
let isDep2Ready = new Dependency(false);
let counter = new Dependency(0);

// function that uses dependency instances
let watchFn = () => {
    // Take a look at IF condition -
    // value can be changed only if dep1 and dep2 is ready
    if (isDep1Ready.value && isDep2Ready.value) {
        return counter.value;
    }
    return undefined;
}

async function subscribe() {
    for await (const value of reaction(watchFn)) {
        reactionFn();
    }
    exitFn();
}
```

#### Framework integrations
##### React
Of course, there is a React integration via stream hooks and HOCs.
For example, here is classic react counter implementation via useRaceStream hook.

```typescript jsx
type ICounter = {
    dependecy: Dependency,
}
export const Counter: React.FC<ICounter> = React.memo(({
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
                    onClick={() => dependency.value++}>
                +
            </button>

            <div className={cn("display")}>
                {value.dependency}
            </div>
        </div>
    )
})
```

Or you can use Reactive HOC:
```typescript jsx
type ICounter = {
    dependecy: Dependency,
}
export const Counter: React.FC<ICounter> = Reactive(({
                                                        dependency,
                                                    }) => {

    return (
        <div className={"container"}>
            <button className={"incrementer"}
                    onClick={() => dependency.value++}>
                +
            </button>

            <div className={cn("display")}>
                {value.dependency}
            </div>
        </div>
    )
})
```

###### 