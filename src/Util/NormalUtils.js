export const getWithDefault = (element, defaultElement) => {
    return defined(element) ? element : defaultElement;
}

export const defined = (element) =>{
    return element !== null && element !== undefined;
}

