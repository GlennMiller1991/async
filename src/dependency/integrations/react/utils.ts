export function isObjectsContentEqual<T extends {}>(obj1: T, obj2: T) {
    for (let key in obj1) {
        if (obj1[key] !== obj2[key]) return false;
    }

    return true;
}