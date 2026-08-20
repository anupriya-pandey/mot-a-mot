/**
 * French Skills — rule-based question generation from the learner's toolbox.
 * Prioritises one defensible answer, toolbox grounding, and validation before display.
 */

const ALLOWED_COUNTS = [5, 10, 15, 20, 25, 30];

const FRENCH_SKILLS_TYPES = [
  'noun_gender',
  'mcq_conjugation',
  'mcq_verb_meaning',
  'mcq_pronoun',
  'mcq_determiner',
  'mcq_meaning',
  'mcq_grammar',
  'mcq_expression',
  'find_errors_multi',
  'fill_blank',
  'match_following',
  'adjective_transform',
  'multiple_choice',
  'match_meaning',
  'find_error',
];

const IRREGULAR_JE = {
  être: 'suis', etre: 'suis', avoir: 'ai', aller: 'vais', faire: 'fais', venir: 'viens',
  prendre: 'prends', pouvoir: 'peux', vouloir: 'veux', savoir: 'sais', voir: 'vois',
  dire: 'dis', devoir: 'dois', manger: 'mange', boire: 'bois', lire: 'lis',
};

const IRREGULAR_NOUS = {
  être: 'sommes', etre: 'sommes', avoir: 'avons', aller: 'allons', faire: 'faisons',
  venir: 'venons', prendre: 'prenons', pouvoir: 'pouvons', vouloir: 'voulons',
  savoir: 'savons', voir: 'voyons', manger: 'mangeons', boire: 'buvons',
};

const IRREGULAR_TU = {
  être: 'es', etre: 'es', avoir: 'as', aller: 'vas', faire: 'fais', venir: 'viens',
  manger: 'manges', boire: 'bois',
};

const LINKING_VERBS = new Set(['être', 'etre', 'sembler', 'devenir', 'rester', 'paraître', 'paraitre']);
const MOTION_VERBS = new Set(['aller', 'venir', 'partir', 'arriver']);
const LOCATION_VERBS = new Set(['habiter', 'dormir', 'vivre', 'étudier', 'etudier', 'marcher', 'rester']);
const WORK_VERBS = new Set(['travailler', 'bosser', 'étudier', 'etudier']);
const SPEAKING_VERBS = new Set(['parler', 'dire', 'répondre', 'repondre']);

const TRANSITIVE_VERBS = new Set([
  'aider', 'voir', 'entendre', 'chercher', 'trouver', 'regarder', 'écouter', 'ecouter',
  'connaître', 'connaitre', 'aimer', 'manger', 'boire', 'lire', 'écrire', 'ecrire',
  'appeler', 'porter', 'donner', 'prendre', 'acheter', 'vendre', 'apprendre', 'enseigner',
  'inviter', 'remercier', 'saluer', 'faire',
]);

const PERSON_NOUNS = new Set([
  'tante', 'oncle', 'mère', 'mere', 'père', 'pere', 'soeur', 'sœur', 'frère', 'frere',
  'fille', 'fils', 'ami', 'amie', 'collègue', 'collegue', 'professeur', 'professeure',
]);

const POSSESSIVE_DETERMINERS = new Set([
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
]);

const DEMONSTRATIVE_DETERMINERS = new Set(['ce', 'cet', 'cette', 'ces']);

const WORK_FRAMES = ['tard ce soir', 'beaucoup', "à l'office", 'dur'];
const LOCATION_FRAMES = ['près de la gare', 'à Paris', 'dans une grande ville', "à l'école"];

const DEFAULT_DIRECT_OBJECTS = [
  'mes collègues', 'ma mère', 'mes amis', 'mon frère', 'ma famille', 'du pain', 'une pizza', 'un livre',
];

const LINKING_COMPLEMENTS = ['content', 'fatigué', 'fatigue', 'prêt', 'pret', 'heureux', 'malade'];

const FEMININE_NOUNS = new Set([
  'maison', 'femme', 'table', 'voiture', 'école', 'ecole', 'porte', 'fenêtre', 'fenetre',
  'musée', 'musee', 'nation', 'question', 'réponse', 'reponse', 'sœur', 'soeur',
  'ville', 'pizza', 'salle', 'chambre', 'histoire', 'idée', 'idee',
]);

const GRAMMAR_MCQ_BANK = [
  {
    id: 'contracted-au',
    matchLemma: (l) => ['au', 'à le'].includes(l),
    sentence: 'Je vais ___ marché.',
    correct: 'au',
    options: ['au', 'à le', 'à la', 'du'],
    explanation: 'À + le contracts to au before a masculine noun like marché.',
  },
  {
    id: 'partitive-du',
    matchLemma: (l) => ['du', 'de le'].includes(l) || l === 'pain',
    sentence: 'Je mange ___ pain.',
    correct: 'du',
    options: ['du', 'de la', 'le', 'au'],
    explanation: 'Partitive du is used with uncountable masculine nouns like pain.',
  },
  {
    id: 'negative-partitive',
    matchLemma: (l) => l === 'de' || l.includes('pas'),
    sentence: 'Je ne bois pas ___ café.',
    correct: 'de',
    options: ['de', 'du', 'le', 'au'],
    explanation: 'After negation, the partitive du becomes de.',
  },
];

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeLemma(lemma) {
  return String(lemma ?? '').trim().toLowerCase().normalize('NFC');
}

function primaryMeaning(entry) {
  return String(entry.meaning ?? '').split(/[/;]/)[0].trim();
}

function isEligible(entry) {
  if (!entry?.lemma?.trim() || !entry?.meaning?.trim()) return false;
  const lemma = entry.lemma.trim();
  if (/^[A-Z][a-z]+$/.test(lemma) && !/[àâäéèêëïîôùûüç]/.test(lemma)) return false;
  return true;
}

function isFeminineNoun(entry) {
  if (entry.nounGenderForms?.feminine) return true;
  const key = normalizeLemma(entry.lemma);
  if (FEMININE_NOUNS.has(key)) return true;
  if (key.endsWith('tion') || key.endsWith('sion')) return true;
  if (key.endsWith('e') && !key.endsWith('age')) return true;
  return false;
}

function conjugateJe(lemma) {
  const v = normalizeLemma(lemma);
  if (IRREGULAR_JE[v]) return IRREGULAR_JE[v];
  if (v.endsWith('ger')) return `${v.slice(0, -1)}e`;
  if (v.endsWith('er')) return `${v.slice(0, -2)}e`;
  if (v.endsWith('ir')) return `${v.slice(0, -2)}is`;
  if (v.endsWith('re')) return `${v.slice(0, -2)}s`;
  return null;
}

function conjugateNous(lemma) {
  const v = normalizeLemma(lemma);
  if (IRREGULAR_NOUS[v]) return IRREGULAR_NOUS[v];
  if (v.endsWith('ger')) return `${v.slice(0, -1)}eons`;
  if (v.endsWith('er')) return `${v.slice(0, -2)}ons`;
  if (v.endsWith('ir')) return `${v.slice(0, -2)}issons`;
  if (v.endsWith('re')) return `${v.slice(0, -2)}ons`;
  return null;
}

function conjugateTu(lemma) {
  const v = normalizeLemma(lemma);
  if (IRREGULAR_TU[v]) return IRREGULAR_TU[v];
  if (v.endsWith('ger')) return `${v.slice(0, -1)}es`;
  if (v.endsWith('er')) return `${v.slice(0, -2)}es`;
  if (v.endsWith('ir')) return `${v.slice(0, -2)}is`;
  if (v.endsWith('re')) return `${v.slice(0, -2)}s`;
  return null;
}

function getVerbProfile(lemma) {
  const v = normalizeLemma(lemma);
  if (LINKING_VERBS.has(v)) return 'linking';
  if (MOTION_VERBS.has(v)) return 'motion';
  if (WORK_VERBS.has(v)) return 'work';
  if (LOCATION_VERBS.has(v)) return 'location';
  if (SPEAKING_VERBS.has(v)) return 'speaking';
  if (TRANSITIVE_VERBS.has(v)) return 'transitive';
  return 'work';
}

function isPersonNoun(entry) {
  return PERSON_NOUNS.has(normalizeLemma(entry?.lemma ?? ''));
}

function isFoodOrThingNoun(entry) {
  if (!entry || entry.partOfSpeech !== 'Nouns') return false;
  if (isPersonNoun(entry)) return false;
  return true;
}

function pickDirectObjectPhrase(pool, index, verbLemma) {
  const verb = normalizeLemma(verbLemma);
  const peopleVerbs = new Set(['voir', 'aimer', 'inviter', 'appeler', 'saluer', 'remercier', 'aider']);
  const eatVerbs = new Set(['manger', 'boire', 'prendre']);

  const nouns = pool.filter((entry) => entry.partOfSpeech === 'Nouns');
  const filtered = nouns.filter((entry) => {
    if (peopleVerbs.has(verb)) return true;
    if (eatVerbs.has(verb)) return isFoodOrThingNoun(entry) || !isPersonNoun(entry);
    return isFoodOrThingNoun(entry);
  });

  if (filtered.length > 0) {
    const entry = filtered[index % filtered.length];
    const lemma = entry.lemma.trim();
    if (peopleVerbs.has(verb)) {
      if (isLikelyFeminineNoun(lemma)) return `ma ${lemma}`;
      if (/^[aeiouhâêîôùûéèëïü]/i.test(lemma)) return `l'${lemma}`;
      return `mon ${lemma}`;
    }
    return nounPhrase(entry);
  }

  if (peopleVerbs.has(verb)) {
    return DEFAULT_DIRECT_OBJECTS[index % 5];
  }
  return DEFAULT_DIRECT_OBJECTS[(index + 5) % DEFAULT_DIRECT_OBJECTS.length];
}

function isLikelyFeminineNoun(lemma) {
  const key = normalizeLemma(lemma);
  if (FEMININE_NOUNS.has(key)) return true;
  if (key.endsWith('tion') || key.endsWith('sion')) return true;
  if (key.endsWith('e') && !key.endsWith('age')) return true;
  return false;
}

function fillBlankSlot(sentenceWithBlank, answer) {
  return String(sentenceWithBlank ?? '').replace('___', String(answer ?? '').trim());
}

function sentenceWithVerbObjectIsNatural(sentenceWithBlank, conjugated, verbLemma) {
  if (!verbLemma) return true;
  const filled = fillBlankSlot(sentenceWithBlank, conjugated).toLowerCase();
  const verb = normalizeLemma(verbLemma);
  const profile = getVerbProfile(verb);

  if (profile === 'linking' && /(?:une|un)\s+\w+/.test(filled)) return false;
  if ((profile === 'work' || profile === 'location' || profile === 'motion') && /(?:une|un)\s+(?:tante|oncle|mère|père|soeur|frère|ami|collègue)/.test(filled)) {
    return false;
  }
  if (profile === 'transitive' || TRANSITIVE_VERBS.has(verb)) {
    const idx = filled.indexOf(String(conjugated).toLowerCase());
    if (idx >= 0) {
      const after = filled.slice(idx + String(conjugated).length);
      const hasObject = /^\s*(?:mon|ma|mes|du|de la|de l'|le|la|les|un|une|des|l')\s+\S+/i.test(after);
      if (!hasObject) return false;
    }
  }
  if (/\b(?:bossons|bosses|bosse|bossent|travaillons|travaille)\s+(?:une|un)\s+/i.test(filled)) {
    return false;
  }
  return true;
}

function pickToolboxNoun(pool, excludeLemma) {
  const nouns = pool.filter(
    (entry) => entry.partOfSpeech === 'Nouns' && normalizeLemma(entry.lemma) !== excludeLemma,
  );
  if (nouns.length === 0) return null;
  return nouns[Math.floor(Math.random() * nouns.length)];
}

function nounPhrase(entry) {
  if (!entry) return null;
  const noun = entry.lemma.trim();
  const feminine = isFeminineNoun(entry);
  return `${feminine ? 'une' : 'un'} ${noun}`;
}

function jeFrameForVerb(entry, pool, index = 0) {
  const je = conjugateJe(entry.lemma);
  if (!je) return null;
  const profile = getVerbProfile(entry.lemma);
  const vowelStart = /^[aeiouhâêîôùûéèëïü]/i.test(je);
  const prefix = vowelStart ? "J'" : 'Je ';
  const slot = vowelStart ? "J'___" : 'Je ___';

  if (profile === 'linking') {
    const complement = LINKING_COMPLEMENTS.find((word) =>
      pool.some((item) => normalizeLemma(item.lemma) === normalizeLemma(word)),
    ) ?? 'content';
    return `${prefix}___ ${complement}.`;
  }
  if (profile === 'motion') return `${slot} au marché demain.`;
  if (profile === 'work') return `${slot} ${WORK_FRAMES[index % WORK_FRAMES.length]}.`;
  if (profile === 'location') return `${vowelStart ? "J'___ près de la gare." : 'Je ___ près de la gare.'}`;
  if (profile === 'speaking') return `${slot} français en classe.`;
  if (profile === 'transitive') {
    const object = pickDirectObjectPhrase(pool, index, entry.lemma);
    return `${slot} ${object}.`;
  }
  return `${slot} ${WORK_FRAMES[index % WORK_FRAMES.length]}.`;
}

function nousFrameForVerb(entry, pool, index = 0) {
  const profile = getVerbProfile(entry.lemma);
  if (profile === 'linking') return `Nous ___ ${LINKING_COMPLEMENTS[0]}.`;
  if (profile === 'motion') return 'Ce soir, nous ___ au restaurant.';
  if (profile === 'work') return `Ce soir, nous ___ ${WORK_FRAMES[index % WORK_FRAMES.length]}.`;
  if (profile === 'location') return 'Nous ___ dans une grande ville.';
  if (profile === 'speaking') return 'En classe, nous ___ français.';
  if (profile === 'transitive') {
    const object = pickDirectObjectPhrase(pool, index, entry.lemma);
    return `Ce soir, nous ___ ${object}.`;
  }
  return `Ce soir, nous ___ ${WORK_FRAMES[index % WORK_FRAMES.length]}.`;
}

function spellingVariants(form) {
  if (!form) return [];
  const variants = [];
  if (form.endsWith('eons')) variants.push(form.replace('eons', 'ons'));
  if (form.endsWith('eons')) variants.push(form.replace('geons', 'gons'));
  if (form.endsWith('issons')) variants.push(form.replace('issons', 'isons'));
  if (form.endsWith('ez') && form.length > 3) variants.push(`${form.slice(0, -2)}e`);
  if (form.endsWith('es') && form.length > 3) variants.push(form.slice(0, -1));
  if (form.includes('ç')) variants.push(form.replace('ç', 'c'));
  return variants.filter((variant) => variant && variant !== form);
}

function conjugationDistractors(lemma, correct, person) {
  const stem = normalizeLemma(lemma);
  const pool = [
    conjugateJe(lemma),
    conjugateTu(lemma),
    conjugateNous(lemma),
    `${stem.slice(0, -2)}ez`,
    stem.endsWith('ger') ? `${stem.slice(0, -1)}ons` : `${stem.slice(0, -2)}ons`,
    stem.endsWith('ger') ? `${stem.slice(0, -1)}e` : `${stem.slice(0, -2)}e`,
    lemma,
    ...spellingVariants(correct),
  ].filter(Boolean);

  if (person === 'nous') {
    pool.push(conjugateTu(lemma), conjugateJe(lemma));
  }

  return [...new Set(pool)].filter((value) => value !== correct);
}

function meaningDistractors(entry, pool, correctJe) {
  const otherVerbs = shuffle(
    pool.filter((item) => item.partOfSpeech === 'Verbs' && item.lemma !== entry.lemma),
  );
  const forms = otherVerbs
    .map((verb) => conjugateJe(verb.lemma))
    .filter(Boolean)
    .slice(0, 4);
  return [...forms, ...spellingVariants(correctJe)].filter((form) => form !== correctJe);
}

function buildMcqOptions(correctText, distractors) {
  const unique = [...new Set([correctText, ...distractors.filter((d) => d && d !== correctText)])];
  if (unique.length < 4) return null;
  const texts = shuffle(unique).slice(0, 4);
  const options = texts.map((text, i) => ({ id: String.fromCharCode(97 + i), text }));
  const correct = options.find((o) => o.text === correctText);
  if (!correct) return null;
  return { options, correctAnswer: correct.id };
}

function validatePrompt(prompt) {
  if (!prompt?.type || !prompt?.correctAnswer) return false;
  if (prompt.options) {
    const texts = prompt.options.map((option) => option.text);
    if (texts.length !== 4) return false;
    if (new Set(texts).size !== texts.length) return false;
    if (texts.some((text) => /^—/.test(text))) return false;
    if (!prompt.options.some((option) => option.id === prompt.correctAnswer)) return false;
  }
  if (prompt.sentenceWithBlank && !prompt.sentenceWithBlank.includes('___')) return false;
  if (prompt.type === 'fill_blank' && !String(prompt.correctAnswer ?? '').trim()) return false;

  const targetLemma = normalizeLemma(prompt.targetWords?.[0] ?? '');
  const sentence = prompt.sentenceWithBlank ?? '';

  if (prompt.type === 'mcq_verb_meaning' || prompt.type === 'mcq_conjugation' || prompt.type === 'fill_blank') {
    if (prompt.focusCategory === 'Verbs' && targetLemma) {
      const answerText =
        prompt.type === 'fill_blank'
          ? prompt.correctAnswer
          : prompt.options?.find((option) => option.id === prompt.correctAnswer)?.text;
      if (!answerText || !sentenceWithVerbObjectIsNatural(sentence, answerText, targetLemma)) return false;
    }
  }

  if (prompt.type === 'mcq_conjugation' || prompt.type === 'mcq_verb_meaning') {
    const profile = getVerbProfile(targetLemma);
    if (profile === 'linking' && /une|un |du |de la /i.test(sentence)) return false;
    if ((profile === 'work' || profile === 'location' || profile === 'motion') && /(?:une|un)\s+(?:tante|oncle|mère|père|soeur|frère)/i.test(sentence)) {
      return false;
    }
  }

  if (prompt.options?.length && sentence.includes('___')) {
    const validCount = prompt.options.filter((option) =>
      sentenceWithVerbObjectIsNatural(
        sentence,
        option.text,
        prompt.focusCategory === 'Verbs' ? targetLemma : '',
      ),
    ).length;
    const correctOption = prompt.options.find((option) => option.id === prompt.correctAnswer);
    if (correctOption && !sentenceWithVerbObjectIsNatural(sentence, correctOption.text, targetLemma)) {
      return false;
    }
    if (prompt.focusCategory === 'Verbs' && validCount !== 1) return false;
  }

  return true;
}

function basePrompt(partial, index) {
  return {
    stage: 'quick',
    hints: [],
    index,
    ...partial,
  };
}

function fingerprint(prompt) {
  return `${prompt.type}|${(prompt.targetWords ?? []).join(',')}|${prompt.sentenceWithBlank ?? prompt.frenchPrompt ?? ''}`;
}

function canAdd(prompt, prompts, completed, usedPrints) {
  if (!prompt) return false;
  if (!validatePrompt(prompt)) return false;
  if (completed.has(prompt.id)) return false;
  if (prompts.some((p) => p.id === prompt.id)) return false;
  const fp = fingerprint(prompt);
  if (usedPrints.has(fp)) return false;
  return true;
}

function buildNounGender(entry, pool, index) {
  if (entry.partOfSpeech !== 'Nouns') return null;
  const noun = entry.lemma.trim();
  const feminine = isFeminineNoun(entry);
  const correct = feminine ? 'une' : 'un';
  const distractors = feminine ? ['un', 'des', 'le'] : ['une', 'des', 'la'];
  const built = buildMcqOptions(correct, distractors);
  if (!built) return null;
  const { options, correctAnswer } = built;
  return basePrompt({
    id: `fs-gender-${normalizeLemma(noun)}-${index}`,
    type: 'noun_gender',
    title: 'Noun gender',
    instruction: 'Choose the correct article for this noun.',
    targetWords: [entry.lemma],
    focusCategory: 'Nouns',
    sentenceWithBlank: `___ ${noun}`,
    options,
    correctAnswer,
    explanation: `« ${noun} » is ${feminine ? 'feminine' : 'masculine'}, so use « ${correct} ».`,
  }, index);
}

function nounValid(v) {
  return v && v.length > 1;
}

function buildMcqConjugation(entry, pool, index) {
  if (entry.partOfSpeech !== 'Verbs') return null;
  const nous = conjugateNous(entry.lemma);
  if (!nous || nous.length < 2) return null;
  const stem = normalizeLemma(entry.lemma);
  const distractors = conjugationDistractors(entry.lemma, nous, 'nous');
  const built = buildMcqOptions(nous, distractors);
  if (!built) return null;
  const { options, correctAnswer } = built;
  const sentenceWithBlank = nousFrameForVerb(entry, pool, index);
  if (!sentenceWithBlank || !sentenceWithVerbObjectIsNatural(sentenceWithBlank, nous, entry.lemma)) return null;
  return basePrompt({
    id: `fs-conj-${stem}-${index}`,
    type: 'mcq_conjugation',
    title: 'Conjugation',
    instruction: 'Pick the correct conjugation to complete the sentence.',
    targetWords: [entry.lemma],
    focusCategory: 'Verbs',
    formFocus: 'present-nous',
    sentenceWithBlank,
    englishPrompt: primaryMeaning(entry),
    options,
    correctAnswer,
    explanation: `With nous, « ${entry.lemma} » becomes « ${nous} ».`,
  }, index);
}

function buildMcqVerbMeaning(entry, pool, index) {
  if (entry.partOfSpeech !== 'Verbs') return null;
  const je = conjugateJe(entry.lemma);
  if (!je) return null;
  const sentenceWithBlank = jeFrameForVerb(entry, pool, index);
  if (!sentenceWithBlank || !sentenceWithVerbObjectIsNatural(sentenceWithBlank, je, entry.lemma)) return null;
  const built = buildMcqOptions(je, meaningDistractors(entry, pool, je));
  if (!built) return null;
  const { options, correctAnswer } = built;
  return basePrompt({
    id: `fs-vmean-${normalizeLemma(entry.lemma)}-${index}`,
    type: 'mcq_verb_meaning',
    title: 'Verb meaning',
    instruction: 'Pick the verb form that matches the meaning in context.',
    targetWords: [entry.lemma],
    focusCategory: 'Verbs',
    sentenceWithBlank,
    englishPrompt: primaryMeaning(entry),
    options,
    correctAnswer,
    explanation: `« ${entry.lemma} » means ${primaryMeaning(entry)} — here « ${je} ».`,
  }, index);
}

function normalizePronounKey(lemma) {
  const key = normalizeLemma(lemma);
  if (key === "j'" || key === 'j') return 'je';
  return key;
}

const PRONOUN_MCQ_FRAMES = {
  je: { sentence: "___ habite dans un petit village.", correct: "J'" },
  tu: { sentence: '___ habites près de la gare.', correct: 'Tu' },
  il: { sentence: '___ habite dans un petit village.', correct: 'Il' },
  elle: { sentence: '___ habite dans un petit village.', correct: 'Elle' },
  on: { sentence: '___ habite dans un petit village.', correct: 'On' },
  nous: { sentence: '___ travaillons tous les jours.', correct: 'Nous' },
  vous: { sentence: '___ parlez français.', correct: 'Vous' },
  ils: { sentence: '___ parlent français.', correct: 'Ils' },
  elles: { sentence: '___ parlent français.', correct: 'Elles' },
};

function buildMcqPronoun(entry, pool, index) {
  if (entry.partOfSpeech !== 'Pronouns') return null;
  const pronounKey = normalizePronounKey(entry.lemma);
  const frame = PRONOUN_MCQ_FRAMES[pronounKey];
  if (!frame) return null;

  const distractorEntries = shuffle(
    pool.filter((item) => {
      if (item.partOfSpeech !== 'Pronouns') return false;
      const key = normalizePronounKey(item.lemma);
      return key !== pronounKey && Boolean(PRONOUN_MCQ_FRAMES[key]);
    }),
  ).slice(0, 3);

  if (distractorEntries.length < 3) {
    const fallback = ['Je', 'Tu', 'Il', 'Elle', 'Nous', 'Vous', 'Ils', 'On']
      .filter((value) => value.toLowerCase() !== frame.correct.toLowerCase() && value !== frame.correct)
      .slice(0, 3);
    if (fallback.length < 3) return null;
    const built = buildMcqOptions(frame.correct, fallback);
    if (!built) return null;
    const { options, correctAnswer } = built;
    return basePrompt({
      id: `fs-pron-${pronounKey}-${index}`,
      type: 'mcq_pronoun',
      title: 'Subject pronoun',
      instruction: 'Choose the pronoun that agrees with the verb.',
      targetWords: [entry.lemma],
      focusCategory: 'Pronouns',
      sentenceWithBlank: frame.sentence,
      options,
      correctAnswer,
      explanation: `The verb form requires « ${frame.correct} ».`,
    }, index);
  }

  const distractors = distractorEntries.map(
    (item) => PRONOUN_MCQ_FRAMES[normalizePronounKey(item.lemma)].correct,
  );
  const built = buildMcqOptions(frame.correct, distractors);
  if (!built) return null;
  const { options, correctAnswer } = built;
  return basePrompt({
    id: `fs-pron-${pronounKey}-${index}`,
    type: 'mcq_pronoun',
    title: 'Subject pronoun',
    instruction: 'Choose the pronoun that agrees with the verb.',
    targetWords: [entry.lemma],
    focusCategory: 'Pronouns',
    sentenceWithBlank: frame.sentence,
    options,
    correctAnswer,
    explanation: `The verb form requires « ${frame.correct} ».`,
  }, index);
}

function capitalizeDeterminer(value) {
  const text = String(value ?? '').trim();
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function pickNounForDeterminer(pool, feminine, index) {
  const nouns = pool.filter((entry) => entry.partOfSpeech === 'Nouns');
  const matching = nouns.filter((entry) => isFeminineNoun(entry) === feminine);
  const source = matching.length > 0 ? matching : nouns;
  if (source.length === 0) {
    return feminine ? 'maison' : 'livre';
  }
  return source[index % source.length].lemma.trim();
}

function buildMcqDeterminer(entry, pool, index) {
  if (entry.partOfSpeech !== 'Articles / Determiners') return null;
  const lemma = normalizeLemma(entry.lemma);
  if (!POSSESSIVE_DETERMINERS.has(lemma) && !DEMONSTRATIVE_DETERMINERS.has(lemma)) return null;

  let sentenceWithBlank;
  let correct;
  let distractors;
  let title;
  let instruction;

  if (POSSESSIVE_DETERMINERS.has(lemma)) {
    title = 'Possessive determiner';
    instruction = 'Choose the possessive that agrees with the noun.';
    if (lemma === 'mon') {
      const noun = pickNounForDeterminer(pool, false, index);
      sentenceWithBlank = `___ ${noun} est ici.`;
      correct = 'Mon';
      distractors = ['Ma', 'Mes', 'Ton'];
    } else if (lemma === 'ma') {
      const noun = pickNounForDeterminer(pool, true, index);
      sentenceWithBlank = `___ ${noun} est ici.`;
      correct = 'Ma';
      distractors = ['Mon', 'Mes', 'Sa'];
    } else if (lemma === 'mes') {
      sentenceWithBlank = '___ amis arrivent demain.';
      correct = 'Mes';
      distractors = ['Mon', 'Ma', 'Ses'];
    } else if (lemma === 'ton' || lemma === 'ta' || lemma === 'tes') {
      const feminine = lemma === 'ta' || lemma === 'tes';
      const noun = feminine ? pickNounForDeterminer(pool, true, index) : pickNounForDeterminer(pool, false, index);
      sentenceWithBlank = feminine && lemma === 'tes' ? '___ idées sont bonnes.' : `___ ${noun} est ici.`;
      correct = capitalizeDeterminer(lemma);
      distractors = ['Ton', 'Ta', 'Tes', 'Son'].filter((value) => value !== correct);
    } else if (lemma === 'son' || lemma === 'sa' || lemma === 'ses') {
      const feminine = lemma === 'sa' || lemma === 'ses';
      const noun = feminine ? pickNounForDeterminer(pool, true, index) : pickNounForDeterminer(pool, false, index);
      sentenceWithBlank = lemma === 'ses' ? '___ enfants jouent dehors.' : `___ ${noun} est ici.`;
      correct = capitalizeDeterminer(lemma);
      distractors = ['Son', 'Sa', 'Ses', 'Leur'].filter((value) => value !== correct);
    } else {
      const noun = pickNounForDeterminer(pool, false, index);
      sentenceWithBlank = `___ ${noun} est ici.`;
      correct = capitalizeDeterminer(lemma);
      distractors = ['Notre', 'Nos', 'Votre', 'Leur'].filter((value) => value !== correct);
    }
  } else {
    title = 'Demonstrative determiner';
    instruction = 'Choose the demonstrative that matches the noun.';
    const feminine = lemma === 'cette' || lemma === 'ces';
    const noun = pickNounForDeterminer(pool, feminine, index);
    if (lemma === 'ce') {
      sentenceWithBlank = `___ ${noun} est intéressant.`;
      correct = 'Ce';
      distractors = ['Cet', 'Cette', 'Ces'];
    } else if (lemma === 'cet') {
      sentenceWithBlank = '___ homme parle français.';
      correct = 'Cet';
      distractors = ['Ce', 'Cette', 'Ces'];
    } else if (lemma === 'cette') {
      sentenceWithBlank = `___ ${noun} est intéressante.`;
      correct = 'Cette';
      distractors = ['Ce', 'Cet', 'Ces'];
    } else {
      sentenceWithBlank = '___ enfants jouent dehors.';
      correct = 'Ces';
      distractors = ['Ce', 'Cet', 'Cette'];
    }
  }

  const built = buildMcqOptions(correct, distractors);
  if (!built) return null;
  const { options, correctAnswer } = built;
  return basePrompt({
    id: `fs-det-${lemma}-${index}`,
    type: 'mcq_determiner',
    title,
    instruction,
    targetWords: [entry.lemma],
    focusCategory: 'Articles / Determiners',
    sentenceWithBlank,
    options,
    correctAnswer,
    explanation: `« ${correct} » is the correct form here.`,
  }, index);
}

function buildMcqMeaning(entry, pool, index) {
  const correct = primaryMeaning(entry);
  const distractors = shuffle(pool.filter((e) => e.lemma !== entry.lemma))
    .map((e) => primaryMeaning(e))
    .filter((m) => m && m.toLowerCase() !== correct.toLowerCase())
    .slice(0, 3);
  if (distractors.length < 3) return null;
  const built = buildMcqOptions(correct, distractors);
  if (!built) return null;
  const { options, correctAnswer } = built;
  return basePrompt({
    id: `fs-mean-${normalizeLemma(entry.lemma)}-${index}`,
    type: 'mcq_meaning',
    title: 'Word meaning',
    instruction: `What does « ${entry.lemma} » mean?`,
    targetWords: [entry.lemma],
    focusCategory: entry.partOfSpeech,
    frenchPrompt: entry.lemma,
    options,
    correctAnswer,
    explanation: `« ${entry.lemma} » means ${correct}.`,
  }, index);
}

function buildMcqGrammar(entry, pool, index) {
  const lemma = normalizeLemma(entry.lemma);
  const bank = GRAMMAR_MCQ_BANK.find((t) => t.matchLemma(lemma) || t.matchLemma(primaryMeaning(entry).toLowerCase()));
  if (!bank) return null;
  const built = buildMcqOptions(bank.correct, bank.options.filter((o) => o !== bank.correct));
  if (!built) return null;
  const { options, correctAnswer } = built;
  return basePrompt({
    id: `fs-gram-${bank.id}-${index}`,
    type: 'mcq_grammar',
    title: 'Grammar',
    instruction: 'Pick the grammatically correct form.',
    targetWords: [entry.lemma],
    focusCategory: entry.partOfSpeech,
    sentenceWithBlank: bank.sentence,
    options,
    correctAnswer,
    explanation: bank.explanation,
  }, index);
}

function buildMcqExpression(entry, pool, index) {
  if (entry.partOfSpeech !== 'Expressions') return null;
  const expr = entry.lemma.trim();
  const meaning = primaryMeaning(entry);
  if (expr.toLowerCase().includes('besoin')) {
    const built = buildMcqOptions('ai besoin de', ['suis besoin de', 'fais besoin de', 'ai besoin à']);
    if (!built) return null;
    const { options, correctAnswer } = built;
    return basePrompt({
      id: `fs-expr-${normalizeLemma(expr)}-${index}`,
      type: 'mcq_expression',
      title: 'Expression',
      instruction: 'Complete the expression correctly.',
      targetWords: [entry.lemma],
      focusCategory: 'Expressions',
      sentenceWithBlank: "Je ___ partir maintenant.",
      options,
      correctAnswer,
      explanation: `The expression is « avoir besoin de » — ${meaning}.`,
    }, index);
  }
  return buildMcqMeaning(entry, pool, index);
}

function buildFindErrorsMulti(entry, pool, index) {
  if (entry.partOfSpeech !== 'Adjectives' && entry.partOfSpeech !== 'Verbs') return null;
  if (entry.partOfSpeech === 'Adjectives' && entry.adjectiveForms) {
    const m = entry.adjectiveForms.masculineSingular ?? entry.lemma;
    const f = entry.adjectiveForms.feminineSingular;
    if (!f || m === f) return null;
    const passage = `Ma sœur est très ${m}.\nElle travaille ${m === f ? 'bien' : 'beaucoup'}.`;
    const options = [
      { id: 'a', text: `Change '${m}' to '${f}' (agreement)` },
      { id: 'b', text: "Change 'travaille' to 'travaillent'" },
      { id: 'c', text: "Change 'Ma' to 'Mon'" },
    ];
    return basePrompt({
      id: `fs-ferr-${normalizeLemma(entry.lemma)}-${index}`,
      type: 'find_errors_multi',
      title: 'Find every error',
      instruction: 'Select every error in the passage. All correct picks, no wrong picks.',
      targetWords: [entry.lemma],
      focusCategory: entry.partOfSpeech,
      flawedPassage: passage,
      multiSelect: true,
      options,
      correctAnswer: 'a',
      explanation: `With a feminine subject, use « ${f} », not « ${m} ».`,
    }, index);
  }
  return null;
}

function buildFillBlank(entry, pool, index) {
  if (entry.partOfSpeech === 'Verbs') {
    const je = conjugateJe(entry.lemma);
    if (!je) return null;
    const sentenceWithBlank = jeFrameForVerb(entry, pool, index);
    if (!sentenceWithBlank || !sentenceWithVerbObjectIsNatural(sentenceWithBlank, je, entry.lemma)) return null;
    return basePrompt({
      id: `fs-fill-v-${normalizeLemma(entry.lemma)}-${index}`,
      type: 'fill_blank',
      title: 'Fill in the blank',
      instruction: 'Type the missing French word.',
      targetWords: [entry.lemma],
      focusCategory: 'Verbs',
      sentenceWithBlank,
      englishPrompt: primaryMeaning(entry),
      correctAnswer: je,
      explanation: `Present tense of « ${entry.lemma} » with je: « ${je} ».`,
    }, index);
  }
  if (entry.partOfSpeech === 'Nouns') {
    const noun = entry.lemma.trim();
    const feminine = isFeminineNoun(entry);
    const sentenceWithBlank = feminine
      ? `Cette ___ est importante pour moi.`
      : `Ce ___ est important pour moi.`;
    return basePrompt({
      id: `fs-fill-n-${normalizeLemma(entry.lemma)}-${index}`,
      type: 'fill_blank',
      title: 'Fill in the blank',
      instruction: 'Type the missing French word.',
      targetWords: [entry.lemma],
      focusCategory: 'Nouns',
      sentenceWithBlank,
      englishPrompt: primaryMeaning(entry),
      correctAnswer: noun,
      explanation: `The missing word is « ${noun} » (${primaryMeaning(entry)}).`,
    }, index);
  }
  return null;
}

function buildAdjectiveTransform(entry, pool, index) {
  if (entry.partOfSpeech !== 'Adjectives' || !entry.adjectiveForms) return null;
  const m = entry.adjectiveForms.masculineSingular ?? entry.lemma;
  const fp = entry.adjectiveForms.femininePlural;
  if (!fp || fp === m) return null;
  return basePrompt({
    id: `fs-adj-${normalizeLemma(entry.lemma)}-${index}`,
    type: 'adjective_transform',
    title: 'Adjective form',
    instruction: `Give the feminine plural form of « ${m} ».`,
    targetWords: [entry.lemma],
    focusCategory: 'Adjectives',
    frenchPrompt: m,
    correctAnswer: fp,
    explanation: `Feminine plural of « ${m} » is « ${fp} ».`,
  }, index);
}

function buildMatchFollowing(pool, index) {
  const rows = shuffle(pool.filter(isEligible)).slice(0, Math.min(4, pool.length));
  if (rows.length < 3) return null;
  const matchRows = rows.map((e, i) => ({ id: `r${i + 1}`, french: e.lemma }));
  const options = shuffle(rows.map((e, i) => ({ id: `o${i + 1}`, text: primaryMeaning(e) })));
  const correctMap = Object.fromEntries(matchRows.map((row, i) => [row.id, options[i].id]));
  return basePrompt({
    id: `fs-match-${index}`,
    type: 'match_following',
    title: 'Matching',
    instruction: 'Match each French word to its English meaning.',
    targetWords: rows.map((r) => r.lemma),
    matchRows,
    options,
    correctAnswer: JSON.stringify(correctMap),
    explanation: 'Each French word is paired with its meaning from your toolbox.',
  }, index);
}

const BUILDERS = {
  noun_gender: (e, p, i) => buildNounGender(e, p, i),
  mcq_conjugation: (e, p, i) => buildMcqConjugation(e, p, i),
  mcq_verb_meaning: (e, p, i) => buildMcqVerbMeaning(e, p, i),
  mcq_pronoun: (e, p, i) => buildMcqPronoun(e, p, i),
  mcq_determiner: (e, p, i) => buildMcqDeterminer(e, p, i),
  mcq_meaning: (e, p, i) => buildMcqMeaning(e, p, i),
  mcq_grammar: (e, p, i) => buildMcqGrammar(e, p, i),
  mcq_expression: (e, p, i) => buildMcqExpression(e, p, i),
  find_errors_multi: (e, p, i) => buildFindErrorsMulti(e, p, i),
  fill_blank: (e, p, i) => buildFillBlank(e, p, i),
  adjective_transform: (e, p, i) => buildAdjectiveTransform(e, p, i),
  match_following: (_e, p, i) => buildMatchFollowing(p, i),
  multiple_choice: (e, p, i) => buildMcqConjugation(e, p, i),
  match_meaning: (e, p, i) => buildMcqMeaning(e, p, i),
  find_error: (e, p, i) => buildFindErrorsMulti(e, p, i),
};

function typeAvailable(type, pool) {
  if (type === 'match_following') return pool.length >= 3;
  if (type === 'noun_gender') return pool.some((e) => e.partOfSpeech === 'Nouns');
  if (type === 'mcq_conjugation' || type === 'mcq_verb_meaning') return pool.some((e) => e.partOfSpeech === 'Verbs');
  if (type === 'mcq_pronoun') return pool.some((e) => e.partOfSpeech === 'Pronouns');
  if (type === 'mcq_determiner') {
    return pool.some((e) =>
      e.partOfSpeech === 'Articles / Determiners' &&
      (POSSESSIVE_DETERMINERS.has(normalizeLemma(e.lemma)) ||
        DEMONSTRATIVE_DETERMINERS.has(normalizeLemma(e.lemma))),
    );
  }
  if (type === 'mcq_expression') return pool.some((e) => e.partOfSpeech === 'Expressions');
  if (type === 'adjective_transform') return pool.some((e) => e.partOfSpeech === 'Adjectives' && e.adjectiveForms);
  if (type === 'mcq_grammar') return pool.some((e) => GRAMMAR_MCQ_BANK.some((b) => b.matchLemma(normalizeLemma(e.lemma))));
  return pool.length > 0;
}

function planTypes(pool, count) {
  const available = FRENCH_SKILLS_TYPES.filter((t) => typeAvailable(t, pool));
  if (available.length === 0) return [];
  const perType = Math.max(1, Math.floor(count / available.length));
  const plan = available.map((type) => ({ type, slots: perType }));
  let assigned = plan.reduce((s, p) => s + p.slots, 0);
  let i = 0;
  while (assigned < count && available.length > 0) {
    plan[i % plan.length].slots += 1;
    assigned += 1;
    i += 1;
  }
  return plan;
}

export function normalizeQuestionCount(value) {
  const n = Number(value);
  if (ALLOWED_COUNTS.includes(n)) return n;
  return 10;
}

export function generateFrenchSkillsSession({ entries, questionCount, completedQuestionIds = [] }) {
  const requestedCount = normalizeQuestionCount(questionCount);
  const pool = shuffle(entries.filter(isEligible));
  const completed = new Set(completedQuestionIds.map(String));
  const prompts = [];
  const usedPrints = new Set();
  let entryCursor = 0;

  const nextEntry = () => {
    if (pool.length === 0) return null;
    const e = pool[entryCursor % pool.length];
    entryCursor += 1;
    return e;
  };

  const tryType = (type, index) => {
    const builder = BUILDERS[type];
    if (!builder) return null;
    if (type === 'match_following') return builder(null, pool, index);
    for (let attempt = 0; attempt < pool.length; attempt += 1) {
      const entry = nextEntry();
      if (!entry) break;
      const candidate = builder(entry, pool, index);
      if (canAdd(candidate, prompts, completed, usedPrints)) {
        usedPrints.add(fingerprint(candidate));
        return candidate;
      }
    }
    return null;
  };

  const plan = planTypes(pool, requestedCount);
  for (const { type, slots } of plan) {
    for (let s = 0; s < slots && prompts.length < requestedCount; s += 1) {
      const prompt = tryType(type, prompts.length + 1);
      if (prompt) prompts.push(prompt);
    }
  }

  let round = 0;
  while (prompts.length < requestedCount && round < pool.length * FRENCH_SKILLS_TYPES.length) {
    const type = FRENCH_SKILLS_TYPES[round % FRENCH_SKILLS_TYPES.length];
    round += 1;
    if (!typeAvailable(type, pool)) continue;
    const prompt = tryType(type, prompts.length + 1);
    if (prompt) prompts.push({ ...prompt, id: `${prompt.id}-r${round}` });
  }

  const generatedCount = prompts.length;
  let sessionNotice;
  if (generatedCount === 0) {
    sessionNotice =
      'Your toolbox does not yet contain enough material for Quick Drills. Add more vocabulary via Grow Your Toolbox, checks, or imports.';
  } else if (generatedCount < requestedCount) {
    sessionNotice = `We could only build ${generatedCount} valid question${generatedCount === 1 ? '' : 's'} from your toolbox (you asked for ${requestedCount}). Add more vocabulary to unlock longer sessions.`;
  }

  const estimatedMinutes = generatedCount <= 5 ? '3–5' : generatedCount <= 10 ? '5–8' : generatedCount <= 20 ? '8–15' : '15–25';

  return {
    prompts: prompts.map((p, i) => ({ ...p, index: i + 1 })),
    requestedCount,
    generatedCount,
    sessionNotice,
    estimatedMinutes,
  };
}
