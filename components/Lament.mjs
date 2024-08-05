import { h } from '../importmap/preact/src/index.js';
import htm from '../importmap/htm/src/index.mjs';
import Furigana from '../modules/furigana.mjs';
import { sitelen } from '../importmap/ucsur-sitelen-pona/lib.mjs';
import { fsw } from '../importmap/@sutton-signwriting/font-ttf/index.mjs';

const fitKlingon = function (pIqaD, latin) {
  const trans = {
    D: '',
    H: '',
    Q: '',
    ch: '',
    gh: '',
    ng: '',
    tlh: '',
    "'": '',
    a: '',
    b: '',
    e: '',
    I: '',
    j: '',
    l: '',
    m: '',
    n: '',
    o: '',
    p: '',
    q: '',
    r: '',
    S: '',
    t: '',
    u: '',
    v: '',
    w: '',
    y: '',
  };
  const output = [];
  for (const letter of pIqaD) {
    if (letter.match(/\s/) && latin.match(/^\s+/)) {
      output.push({ w: letter });
      latin = latin.replace(/^\s+/, '');
      continue;
    }
    for (const i in trans) {
      if (letter == trans[i] && latin.startsWith(i)) {
        output.push([letter, latin.substring(0, i.length)]);
        latin = latin.substring(i.length);
        continue;
      }
    }
  }
  return output;
};

function fitSitelenPona(latin) {
  const latinWords = latin.split(/\s+/);
  const output = [];
  for (const word of latinWords) {
    output.push([sitelen(word), word]);
  }
  return output;
}

const rubifyLemma = function (lemmas) {
  const output = {
    rubified: null,
    unrubified: null,
  };
  if ('ja' in lemmas && 'ja-hira' in lemmas) {
    try {
      const fitted = fit(lemmas.ja.value, lemmas['ja-hira'].value);
      // undo the katakana → hiragana transliteration
      for (let i in fitted) {
        if (fitted[i].w.match(/^[゠-ヿ]+$/)) {
          fitted[i].r = '';
        }
      }
      output.rubified = ruby(fitted, 'ja');
      delete lemmas['ja'];
      delete lemmas['ja-hira'];
    } catch (error) {
      console.error(
        'ja and ja-hira representations of this lexeme are probably invalid',
      );
    }
  } else if (
    'ja' in lemmas &&
    'ja-kana' in lemmas &&
    !lemmas.ja.value.match(/([ぁ-んァ-ン])/)
  ) {
    // if `ja` doesn't contain hiragana or katakana while `ja-kana` is present
    // it is probably a loanword (?)
    // lets rubyfy it as it is
    output.rubified = ruby(
      [{ w: lemmas.ja.value, r: lemmas['ja-kana'].value }],
      'ja',
    );
    delete lemmas['ja'];
    delete lemmas['ja-kana'];
  }
  if ('tlh-piqd' in lemmas && 'tlh-latn' in lemmas) {
    try {
      const fitted = fitKlingon(
        lemmas['tlh-piqd'].value,
        lemmas['tlh-latn'].value,
      );
      if (fitted.length > 0) {
        output.rubified = ruby(fitted, 'tlh');
        delete lemmas['tlh-piqd'];
        delete lemmas['tlh-latn'];
      }
    } catch (error) {
      console.error(
        'tlh-piqd and tlh-latn representations of this lexeme are probably invalid',
      );
    }
  }
  if ('tok' in lemmas) {
    try {
      const fitted = fitSitelenPona(lemmas['tok'].value);
      output.rubified = ruby(fitted, 'tok');
      delete lemmas['tok'];
    } catch (error) {
      console.error('tok is possibly invalid');
    }
  }
  output.unrubified = lemmas;
  return output;
};

const html = htm.bind(h);

function Lament(vars) {
  let fitted = [];
  let lemmas = structuredClone(vars.lemmas);
  for (const lang of ['ase', 'bfi', 'gsg', 'bzs', 'pks']) {
    if (lang in lemmas) {
      fitted.push([
        [
          html`<span
            dangerouslySetInnerHTML=${{
              __html: fsw.signSvg(lemmas[lang].value),
            }}></span>`,
        ],
      ]);
      delete lemmas[lang];
    }
  }
  if (
    ('ja' in lemmas || 'ja-hani' in lemmas) &&
    ('ja-hira' in lemmas || 'ja-kana' in lemmas)
  ) {
    const furi = new Furigana();
    const kanji = lemmas.ja ? 'ja' : 'ja-hani';
    const kana = lemmas['ja-hira'] ? 'ja-hira' : 'ja-kana';

    const fit = furi.fit(lemmas[kanji].value, lemmas[kana].value);
    if (fit) {
      fitted.push(fit);
      delete lemmas[kanji];
      delete lemmas[kana];
    }
  }
  if ('tlh-piqd' in lemmas && 'tlh-latn' in lemmas) {
    const fittedKlingon = fitKlingon(
      lemmas['tlh-piqd'].value,
      lemmas['tlh-latn'].value,
    );
    if (fittedKlingon.length > 0) {
      fitted.push(fittedKlingon);
      delete lemmas['tlh-piqd'];
      delete lemmas['tlh-latn'];
    }
    if ('tok' in lemmas) {
      const fittedToki = fitSitelenPona(lemmas['tok'].value);
      fitted.push(fittedToki);
      delete lemmas['tok'];
    }
  }

  let rubies = [];

  for (const item of fitted) {
    if (rubies.length > 0) {
      rubies.push('/');
    }
    for (const part of item) {
      if (part.length == 1) {
        rubies.push(part);
      } else {
        rubies.push(html`<ruby>${part[0]}<rt>${part[1]}</rt></ruby>`);
      }
    }
  }

  return html`<span
    >${rubies}${rubies.length && Object.entries(lemmas).length ? '/' : null}
    ${lemmas
      ? Object.entries(lemmas)
          .map(([lang, lemma]) => lemma?.value)
          .join('/')
      : 'null'}</span
  >`;
}

export default Lament;
