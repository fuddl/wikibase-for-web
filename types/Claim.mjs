export class Claim {
  constructor({ property, value, datatype, references }) {
    // Initialize mainsnak with common properties
    this.mainsnak = {
      snaktype: 'value',
    };

    if (datatype) {
      this.mainsnak.datatype = datatype;
    }

    if (value) {
      this.mainsnak.datavalue = {};
    }

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

  // Override toJSON to control serialization
  toJSON() {
    // This method is automatically used by JSON.stringify.
    return {
      mainsnak: this.mainsnak,
      type: this.type,
      rank: this.rank,
      references: this.references,
    };
  }
}

export class UrlClaim extends Claim {
  constructor({ property, value, references }) {
    super({ property, value, references });
    this.mainsnak.datavalue.value = value;
    this.mainsnak.datavalue.type = 'string';
    this.mainsnak.datatype = 'url';
  }
}

export class ExternalIdClaim extends Claim {
  constructor({ property, value, references }) {
    super({ property, value, references });
    this.mainsnak.datavalue.value = value;
    this.mainsnak.datavalue.type = 'string';
    this.mainsnak.datatype = 'external-id';
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
}

export class MonolingualTextClaim extends Claim {
  constructor({ property, text, language, references }) {
    super({ property, value: { text: text, language: language }, references });

    this.mainsnak.datavalue.type = 'monolingualtext';
    this.mainsnak.datatype = 'monolingualtext';
  }
}

export class QuantityClaim extends Claim {
  constructor({ property, amount, unit = '1', references }) {
    super({ property, value: { amount: amount, unit: unit } });

    this.mainsnak.datavalue.type = 'quantity';
    this.mainsnak.datatype = 'quantity';
  }
}

export class TimeClaim extends Claim {
  constructor({
    property,
    time,
    after = 0,
    before = 0,
    precision,
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
}
