class Furigana {
  constructor() {
    this.hiragana = this.set`
      あいうえおかきくけこさしすせそ
      たちつてとなにぬねのはひふへほ
      まみむめもやゆよらりるれろわをん
      がぎぐげござじずぜぞだぢづでど
      ばびぶべぼぱぴぷぺぽゃゅょっー
    `;

    this.katakana = this.set`
      アイウエオカキクケコサシスセソ
      タチツテトナニヌネノハヒフヘホ
      マミムメモヤユヨラリルレロワヲン
      ガギグゲゴザジズゼゾダヂヅデド
      バビブベボパピプペポャュョッー
    `;

    this.kanaPunctuation = '。、「」ー';

    this.kanaAndPunctuation = [
      ...this.hiragana,
      ...this.katakana,
      ...this.kanaPunctuation,
    ];

    this.variationSelectors = '\uFE0E\uFE0F';
  }

  splitWithUnicodeModifiers(input) {
    // Create a segmenter for grapheme clusters
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: 'grapheme',
    });

    // Use the segmenter to segment the input string
    const segments = segmenter.segment(input);

    // Convert the segments into an array of strings
    const result = Array.from(segments, segment => segment.segment);

    return result;
  }

  set(strings) {
    return strings.join().replace(/\s+/g, '');
  }

  isKana(char) {
    return this.kanaAndPunctuation.includes(char[0]);
  }

  guessMora(input) {
    const disallowedStart = 'っゃゅょんィェー';
    const chunks = [];

    for (let i = 0; i < input.length; i++) {
      if (disallowedStart.includes(input[i])) {
        chunks[chunks.length - 1] += input[i];
        continue;
      }
      chunks.push(input[i]);
    }

    return chunks;
  }
  mergeMora(mora, desiredLength) {
    // Calculate the target chunk length based on total characters
    const totalChars = mora.reduce((acc, item) => acc + item.length, 0);
    const targetChunkLength = Math.ceil(totalChars / desiredLength);

    let result = [];
    let currentString = '';

    // Function to decide whether to push the current string to the result
    function pushCurrentString() {
      if (currentString.length > 0) {
        result.push(currentString);
        currentString = '';
      }
    }

    for (const item of mora) {
      // Check if adding this item will exceed the target chunk length
      if (
        currentString.length + item.length > targetChunkLength &&
        currentString.length > 0
      ) {
        pushCurrentString();
      }

      // Add item to the current string
      currentString += item;

      // If the current string meets the target chunk length, push to result
      if (currentString.length >= targetChunkLength) {
        pushCurrentString();
      }
    }

    // After the loop, check if there's any leftover string
    pushCurrentString();

    // If the resulting chunks are fewer than desired due to a large last item,
    // consider redistributing or adjusting the criteria
    if (result.length < desiredLength && result.length > 1) {
      let lastChunk = result.pop();
      result[result.length - 1] += lastChunk;
    }

    return result;
  }

  rGroups(str, groups) {
    let result = [];

    const recurse = (index, path) => {
      if (index === str.length && path.length === groups.length) {
        result.push([...path]);
        return;
      }

      if (path.length >= groups.length) {
        return;
      }

      for (let i = 1; i <= str.length - index; i++) {
        const currentSubstring = str.substring(index, index + i);

        // Check if we need to match the reference array at the current path length
        if (path.length < groups.length && this.isKana(groups[path.length])) {
          // Only recurse if the substring matches the reference at this index
          if (currentSubstring !== groups[path.length]) {
            continue;
          }
        }

        path.push(currentSubstring);
        recurse(index + i, path);
        path.pop();
      }
    };

    recurse(0, []);

    return result;
  }
  fit(written, read) {
    let wGroups = [];

    let currentGroup = '';
    let isKanaChunk = this.isKana(written[0]);
    for (let char of written) {
      if (this.isKana(char) === isKanaChunk) {
        currentGroup += char;
      } else if (this.variationSelectors.includes(char)) {
        currentGroup += char;
      } else {
        wGroups.push(currentGroup);
        currentGroup = char;
        isKanaChunk = !isKanaChunk;
      }
    }

    // Add the last chunk if it's not empty
    if (currentGroup.length > 0) {
      wGroups.push(currentGroup);
    }

    let plausableReadGroups = this.rGroups(read, wGroups);

    // filter all possible combinations for if they have matching chunks
    wGroups.forEach((chunk, key) => {
      plausableReadGroups = plausableReadGroups.filter(group => {
        if (this.isKana(chunk)) {
          return group[key] === chunk;
        } else {
          return true;
        }
      });
    });

    let output;

    if (plausableReadGroups.length === 1) {
      output = wGroups.map((chunk, key) => {
        const outputChunk = [chunk];
        if (chunk !== plausableReadGroups[0][key]) {
          outputChunk.push(plausableReadGroups[0][key]);
        }
        return outputChunk;
      });
    }

    for (let i = 0; i < output.length; i++) {
      const group = output[i];
      if (group?.w?.length > 1 && group?.r?.length > 1) {
        const groupArray = this.splitWithUnicodeModifiers(group.w);
        let mora = this.guessMora(group.r);
        if (mora.length > groupArray.length) {
          mora = this.mergeMora(mora, groupArray.length);
        }
        const subgroup = mora.map((m, k) => {
          return [groupArray[k], m];
        });
        output.splice(i, 1, ...subgroup);
      }
    }

    return output;
  }
}

export default Furigana;
