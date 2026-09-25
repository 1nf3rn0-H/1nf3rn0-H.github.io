import currentEdition from '../data/current-edition.json';

export type FieldNotesEdition = typeof currentEdition;

export const normalizeReadTime = (readTime: string) => readTime.replace(/\s+read$/i, '').trim();

const editionModules = import.meta.glob<FieldNotesEdition>('../data/field-notes/*.json', {
  eager: true,
  import: 'default',
});

export const fieldNotesEditions = Object.values(editionModules)
  .sort((a, b) => b.meta.date.localeCompare(a.meta.date));

export const fieldNotesIndex = fieldNotesEditions.map((edition) => ({
  date: edition.meta.date,
  title: edition.title,
  desk: edition.desk,
  standfirst: edition.standfirst,
  readTime: normalizeReadTime(edition.readTime),
  topics: edition.lab.topics,
  searchText: [
    edition.title,
    edition.desk,
    edition.standfirst,
    ...edition.lab.topics,
    ...edition.reports.map((report) => report.title),
    ...edition.technical.modules.map((module) => module.title),
    edition.correlation.title,
    ...edition.research.flatMap((study) => [study.field, study.title]),
    ...edition.lab.sources.map((source) => source.book),
  ].join(' ').toLocaleLowerCase(),
}));
