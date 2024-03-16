export function formDataToData(formData) {
    const result = {};

    formData.forEach((value, key) => {
        const keys = key.split(/[\[\].]+/).filter(k => k !== '');
        let current = result;

        keys.forEach((part, index) => {
            const isLast = index === keys.length - 1;
            if (isLast) {
                current[part] = value;
            } else {
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        });
    });

    const convertArrays = obj => {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        const keys = Object.keys(obj);
        if (keys.every(key => !isNaN(parseInt(key)))) {
            // It's an "array-like" object, convert it to an actual array
            return keys.map(key => convertArrays(obj[key]));
        } else {
            keys.forEach(key => {
                obj[key] = convertArrays(obj[key]);
            });
            return obj;
        }
    };

    return convertArrays(result);
}
