function processFormWithTypes(form) {
    const formData = {};
    const elements = form.elements;

    Array.from(elements).forEach(element => {
        if (
            element.hasAttribute('data-type') &&
            element.type !== 'submit' &&
            element.type !== 'button'
        ) {
            let value = element.value;
            const dataType = element.getAttribute('data-type');

            switch (dataType) {
                case 'int':
                    value = parseInt(value, 10);
                    if (isNaN(value)) value = 0; // Handle invalid integers
                    break;
                case 'float':
                    value = parseFloat(value);
                    if (isNaN(value)) value = 0.0; // Handle invalid floats
                    break;
                case 'object':
                    try {
                        value = JSON.stringify(JSON.parse(value)); // Assuming the value is a JSON string
                    } catch (error) {
                        value = '{}';
                    }
                    break;
            }

            formData[element.name] = value;
        } else {
            if (element.name) {
                formData[element.name] = element.value;
            }
        }
    });

    return formData;
}

export function formDataToData(form) {
    const formData = processFormWithTypes(form);
    const result = {};

    Object.entries(formData).forEach(([key, value]) => {
        const keys = key.split('.').filter(k => k !== '');
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
