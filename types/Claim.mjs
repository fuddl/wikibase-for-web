export class Claim {
  constructor({ property, value, datatype, references }) {
    // Initialize mainsnak with common properties
    this.mainsnak = {
      snaktype: 'value',
    };

    if (datatype) {
      this.mainsnak.datatype = datatype;
    }

    this.mainsnak.datavalue = {};

    if (references) {
      this.references = references;
    }

    // Determine how to handle the value based on its type
    if (value && !Array.isArray(value)) {
      this.mainsnak.datavalue.value = value;
    } else if (Array.isArray(value) && value.length === 1) {
      this.mainsnak.datavalue.value = value[0];
    } else if (Array.isArray(value) && value.length > 1) {
      this.mainsnak.valueOptions = value;
    }

    // Determine how to handle the property based on its type
    if (typeof property === 'string') {
      this.mainsnak.property = property;
    } else if (Array.isArray(property) && property.length === 1) {
      this.mainsnak.property = property[0];
    } else if (Array.isArray(property) && property.length > 1) {
      this.mainsnak.propertyOptions = property;
    }

    this.type = 'statement'; // Default type
    this.rank = 'normal'; // Default rank
  }

  addQualifier(claim) {
    if (!('qualifiers' in this)) {
      this.qualifiers = [];
    }
    this.qualifiers.push(claim);
  }

  // Override toJSON to control serialization
  toJSON() {
    const output = {
      mainsnak: this.mainsnak,
      type: this.type,
      rank: this.rank,
      references: this.references,
    };

    if ('qualifiers' in this) {
      output.qualifiers = this.qualifiers;
    }

    return output;
  }

  hasValue() {
    return false;
  }
}

export class UrlClaim extends Claim {
  constructor({ property, value, references }) {
    super({ property, value, references });
    this.mainsnak.datavalue.value = value ?? '';
    this.mainsnak.datavalue.type = 'string';
    this.mainsnak.datatype = 'url';
  }
  hasValue() {
    try {
      new URL(this?.mainsnak?.datavalue?.value);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export class ExternalIdClaim extends Claim {
  constructor({ property, value, references }) {
    super({ property, value, references });
    this.mainsnak.datavalue.value = value;
    this.mainsnak.datavalue.type = 'string';
    this.mainsnak.datatype = 'external-id';
  }
  hasValue() {
    return this.mainsnak?.datavalue?.value !== '';
  }
}

export class StringClaim extends Claim {
  constructor({ property, value, references }) {
    super({ property, value, references });
    this.mainsnak.datavalue.value = value;
    this.mainsnak.datavalue.type = 'string';
    this.mainsnak.datatype = 'string';
  }
}

export class WikibaseItemClaim extends Claim {
  constructor({ property, value, references }) {
    super({ property, references });

    if (typeof value === 'string') {
      this.mainsnak.datavalue = { value: { id: value } };
    } else if (Array.isArray(value)) {
      if (value.length === 1) {
        this.mainsnak.datavalue = {
          value: { id: value[0] },
        };
      } else if (value.length > 1) {
        this.mainsnak.valueOptions = value;
      }
    }

    // datavalue should not be present if no value has been determined yet
    if (this.mainsnak.datavalue) {
      this.mainsnak.datavalue.type = 'wikibase-entityid';
    }

    this.mainsnak.datatype = 'wikibase-item';
  }
  hasValue() {
    return (
      this.mainsnak?.datavalue?.value?.id &&
      this.mainsnak.datavalue.value.id !== ''
    );
  }
}

export class MonolingualTextClaim extends Claim {
  constructor({ property, text, language, references }) {
    super({
      property,
      value: { text: text ?? '', language: language ?? '' },
      references,
    });

    this.mainsnak.datavalue.type = 'monolingualtext';
    this.mainsnak.datatype = 'monolingualtext';
  }
  hasValue() {
    return (
      this.mainsnak?.datavalue?.value?.text !== '' &&
      this.mainsnak?.datavalue?.value?.language !== ''
    );
  }
}

export class QuantityClaim extends Claim {
  constructor({ property, amount, unit = '1', references }) {
    super({
      property,
      value: { amount: amount ?? '', unit: unit },
      references,
    });

    this.mainsnak.datavalue.type = 'quantity';
    this.mainsnak.datatype = 'quantity';
  }
  hasValue() {
    return this.mainsnak?.datavalue?.value?.amount !== '';
  }
}

export class TimeClaim extends Claim {
  constructor({
    property,
    time = null,
    after = 0,
    before = 0,
    precision = 11,
    calendarmodel = 'wikidata:Q1985727',
    timezone = 0,
    references,
  }) {
    super({
      property,
      value: {
        time: time,
        after: after,
        before: before,
        precision: precision,
        calendarmodel: calendarmodel,
        timezone: timezone,
      },
      references,
    });

    this.mainsnak.datavalue.type = 'time';
    this.mainsnak.datatype = 'time';
  }
  hasValue() {
    return this.mainsnak.datavalue.value.time !== null;
  }
}

export class GlobeCoordinateClaim extends Claim {
  constructor({
    property,
    latitude,
    longitude,
    altitude = null,
    precision = 1,
    globe = 'wikidata:Q2',
    references,
  }) {
    super({
      property,
      value: {
        latitude,
        longitude,
        altitude: altitude,
        precision: precision,
        globe: globe,
      },
      references,
    });

    this.mainsnak.datavalue.type = 'globecoordinate';
    this.mainsnak.datatype = 'globe-coordinate';
  }
  hasValue() {
    if (this?.mainsnak?.datavalue?.value) {
      const value = this.mainsnak.datavalue.value;
      console.debug(value);
      if (
        this.isFloat(value?.latitude ?? '') &&
        this.isFloat(value?.longitude ?? '') &&
        value?.precision > 0
      ) {
        return true;
      }
    }
    return false;
  }
  isFloat(str) {
    return !isNaN(str) && parseFloat(str) == str;
  }
}

export const claimTypeMap = {
  'external-id': ExternalIdClaim,
  'globe-coordinate': GlobeCoordinateClaim,
  'wikibase-item': WikibaseItemClaim,
  monolingualtext: MonolingualTextClaim,
  quantity: QuantityClaim,
  string: StringClaim,
  time: TimeClaim,
  url: UrlClaim,
};

export function reconstructClaim(serializedClaim) {
  if (
    !serializedClaim ||
    !serializedClaim.mainsnak ||
    !serializedClaim.mainsnak.datatype
  ) {
    throw new Error('Invalid serialized claim data');
  }

  const datatype = serializedClaim.mainsnak.datatype;
  const ClaimClass = claimTypeMap[datatype];

  if (!ClaimClass) {
    throw new Error(`Unknown claim type: ${datatype}`);
  }

  // Create a new instance of the corresponding class
  // You might need to adjust the parameters based on your class constructors
  const instance = new ClaimClass({
    property: serializedClaim.mainsnak.property,
    value: serializedClaim.mainsnak.datavalue.value, // Adjust if your structure requires
    references: serializedClaim.references,
    // Add more fields if your constructors require them
  });

  // If there were qualifiers, add them back
  if (serializedClaim.qualifiers) {
    serializedClaim.qualifiers.forEach(qualifier => {
      instance.addQualifier(reconstructClaim(qualifier)); // Recursively reconstruct qualifiers
    });
  }

  return instance;
}
