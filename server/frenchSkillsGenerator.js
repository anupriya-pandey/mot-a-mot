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

function buildMcqOptions(correctText, distractors) {
  const texts = shuffle([correctText, ...distractors.filter((d) => d && d !== correctText)]).slice(0, 4);
  while (texts.length < 4) texts.push(`—${texts.length}`);
  const options = texts.map((text, i) => ({ id: String.fromCharCode(97 + i), text }));
  const correct = options.find((o) => o.text === correctText);
  return { options, correctAnswer: correct?.id ?? 'a' };
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
  const { options, correctAnswer } = buildMcqOptions(correct, distractors);
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
  const distractors = [
    stem.endsWith('ger') ? `${stem.slice(0, -1)}ons` : `${stem.slice(0, -2)}ons`,
    conjugateTu(entry.lemma),
    `${stem.slice(0, -2)}ez`,
    entry.lemma,
  ].filter(Boolean);
  const { options, correctAnswer } = buildMcqOptions(nous, distractors);
  return basePrompt({
    id: `fs-conj-${stem}-${index}`,
    type: 'mcq_conjugation',
    title: 'Conjugation',
    instruction: 'Pick the correct conjugation to complete the sentence.',
    targetWords: [entry.lemma],
    focusCategory: 'Verbs',
    formFocus: 'present-nous',
    sentenceWithBlank: 'Nous ___ une pizza ce soir.',
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
  const verbs = shuffle(pool.filter((e) => e.partOfSpeech === 'Verbs' && e.lemma !== entry.lemma)).slice(0, 3);
  if (verbs.length < 3) return null;
  const options = shuffle([
    { id: 'a', text: je },
    ...verbs.map((v, i) => ({ id: String.fromCharCode(98 + i), text: conjugateJe(v.lemma) })).filter((o) => o.text),
  ]).slice(0, 4);
  if (options.length < 4) return null;
  const correct = options.find((o) => o.text === je);
  return basePrompt({
    id: `fs-vmean-${normalizeLemma(entry.lemma)}-${index}`,
    type: 'mcq_verb_meaning',
    title: 'Verb meaning',
    instruction: 'Pick the verb that matches the meaning in context.',
    targetWords: [entry.lemma],
    focusCategory: 'Verbs',
    sentenceWithBlank: 'Je ___ une pizza.',
    englishPrompt: primaryMeaning(entry),
    options,
    correctAnswer: correct?.id ?? 'a',
    explanation: `« ${entry.lemma} » means ${primaryMeaning(entry)} — here « ${je} ».`,
  }, index);
}

function buildMcqPronoun(entry, pool, index) {
  if (entry.partOfSpeech !== 'Pronouns') return null;
  const lemma = normalizeLemma(entry.lemma);
  let sentence;
  let correct;
  if (lemma === 'nous') {
    sentence = '___ travaillons tous les jours.';
    correct = 'Nous';
  } else if (lemma === 'je') {
    sentence = "___ travaille à l'hôpital.";
    correct = 'Je';
  } else if (lemma === 'tu') {
    sentence = '___ habites près de la gare.';
    correct = 'Tu';
  } else if (lemma === 'ils' || lemma === 'elles') {
    sentence = '___ parlent français.';
    correct = lemma === 'elles' ? 'Elles' : 'Ils';
  } else {
    return null;
  }
  const { options, correctAnswer } = buildMcqOptions(correct, ['Je', 'Nous', 'Tu', 'Ils'].filter((p) => p !== correct));
  return basePrompt({
    id: `fs-pron-${lemma}-${index}`,
    type: 'mcq_pronoun',
    title: 'Subject pronoun',
    instruction: 'Choose the pronoun that agrees with the verb.',
    targetWords: [entry.lemma],
    focusCategory: 'Pronouns',
    sentenceWithBlank: sentence,
    options,
    correctAnswer,
    explanation: `The verb form requires « ${correct} ».`,
  }, index);
}

function buildMcqMeaning(entry, pool, index) {
  const correct = primaryMeaning(entry);
  const distractors = shuffle(pool.filter((e) => e.lemma !== entry.lemma))
    .map((e) => primaryMeaning(e))
    .filter((m) => m && m.toLowerCase() !== correct.toLowerCase())
    .slice(0, 3);
  if (distractors.length < 3) return null;
  const { options, correctAnswer } = buildMcqOptions(correct, distractors);
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
  const { options, correctAnswer } = buildMcqOptions(bank.correct, bank.options.filter((o) => o !== bank.correct));
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
    const { options, correctAnswer } = buildMcqOptions('ai besoin de', ['suis besoin de', 'fais besoin de', 'ai besoin à']);
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
    const frame = /^[aeiouhâêîôùûéèëïü]/i.test(je) ? "Chaque matin, j'___ au travail." : 'Chaque matin, je ___ au travail.';
    return basePrompt({
      id: `fs-fill-v-${normalizeLemma(entry.lemma)}-${index}`,
      type: 'fill_blank',
      title: 'Fill in the blank',
      instruction: 'Type the missing French word.',
      targetWords: [entry.lemma],
      focusCategory: 'Verbs',
      sentenceWithBlank: frame,
      englishPrompt: primaryMeaning(entry),
      correctAnswer: je,
      explanation: `Present tense of « ${entry.lemma} » with je: « ${je} ».`,
    }, index);
  }
  if (entry.partOfSpeech === 'Nouns') {
    return basePrompt({
      id: `fs-fill-n-${normalizeLemma(entry.lemma)}-${index}`,
      type: 'fill_blank',
      title: 'Fill in the blank',
      instruction: 'Type the missing French word.',
      targetWords: [entry.lemma],
      focusCategory: 'Nouns',
      sentenceWithBlank: 'Je prends le ___ pour aller à Paris.',
      englishPrompt: primaryMeaning(entry),
      correctAnswer: entry.lemma,
      explanation: `The missing word is « ${entry.lemma} » (${primaryMeaning(entry)}).`,
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
      'Your toolbox does not yet contain enough material for French Skills. Add more vocabulary via Grow Your Toolbox, checks, or imports.';
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
