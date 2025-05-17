import htm from '../importmap/htm/src/index.mjs';
import { h } from '../importmap/preact/src/index.js';
const html = htm.bind(h);

const mey = html`<ruby lang="tlh"><rb></rb><rt>m</rt></ruby><ruby lang="tlh"><rb></rb><rt>e</rt></ruby><ruby lang="tlh"><rb></rb><rt>y</rt></ruby>`

export default {
  klingonNounMey: {
    requiredLanguage: 'klingon',
    requiredLexicalCategory: 'noun',
    //requiredClaims: [{ property: 'paradigmClass', item: 'meyNoun' }], 
    layout: {
      header: [
      //  {},
        { label: 'singular' },
        { label: 'plural' },
      ],
      groups: {
        noAffixes: [
          [
      //      { type: 'header' },
            { queryForms: { requireFeature: [ 'singular'] } },
            { queryForms: { requireFeature: [ 'plural' ] } },
          ],
        ],
      //   sizeSuffix: [
      //     [
      //       { label: 'augmentative', type: 'header' },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`<ruby lang="tlh"><rb></rb><rt>ʼaʼ</rt></ruby>` },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`<ruby lang="tlh"><rb></rb><rt>ʼaʼ</rt></ruby>${mey}` },
      //     ],
      //     [
      //       { label: 'diminutive', type: 'header' },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`<ruby lang="tlh"><rb></rb><rt>Hom</rt></ruby>` },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`<ruby lang="tlh"><rb></rb><rt>Hom</rt></ruby>${mey}` },
      //     ],[
      //       { label: 'endearingForm', type: 'header' },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`<ruby lang="tlh"><rb></rb><rt>oy</rt></ruby>` },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`<ruby lang="tlh"><rb></rb><rt>oy</rt></ruby>${mey}` },
      //     ],
      //   ],
      //   possessionSuffix: [
      //     [
      //       { label: 'possessive', type: 'header', colspan: 3 },
      //     ],
      //     [
      //       { label: 'firstPerson', type: 'header' },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`<ruby lang="tlh"><rb>ʼ</rb><rt>wIʼ</rt></ruby>` },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`${mey}<ruby lang="tlh"><rb></rb><rt>maj</rt></ruby>` },
      //     ],
      //     [
      //       { label: 'secondPerson', type: 'header' },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`<ruby lang="tlh"><rb></rb><rt>lIj</rt></ruby>` },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`${mey}<ruby lang="tlh"><rb></rb><rt>Hom</rt></ruby>` },
      //     ],[
      //       { label: 'thirdPerson', type: 'header' },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`<ruby lang="tlh"><rb></rb><rt>Daj</rt></ruby>` },
      //       { queryForms: { requireFeature: [ 'singular' ] }, formSuffix: html`${mey}<ruby lang="tlh"><rb></rb><rt>chaj</rt></ruby>` },
      //     ],
      //   ],
      }
    }
  }
}