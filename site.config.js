'use strict';

/**
 * Central site configuration.
 *
 * `tracks` drives the curriculum: the order below is the order learners see in
 * the navigation, on the tracks page and in the prev/next links inside an
 * article. A track's `slug` must match the folder name under `content/`.
 */

const site = {
  name: 'AnalyticsAdda',
  tagline: 'Learn Business Analytics, one concept at a time.',
  description:
    'A free, structured learning portal for business analytics: statistics, SQL, ' +
    'visualization, predictive modelling and real business use-cases, with worked ' +
    'examples and practice quizzes.',
  // Set to '' for a root deploy, or '/RepoName' when hosting on GitHub Pages
  // under a project subpath. Trailing slash must be omitted.
  baseUrl: '',
  url: 'https://fundekaustubh.github.io/LearningManagementSystem',
  author: 'AnalyticsAdda',
  year: new Date().getFullYear(),
};

const tracks = [
  {
    slug: 'foundations',
    title: 'Analytics Foundations',
    short: 'Foundations',
    icon: '🧭',
    color: '#2f8f5b',
    level: 'Beginner',
    summary:
      'What business analytics actually is, the four analytics types, the project ' +
      'lifecycle, data measurement scales and how to turn a vague business ask into ' +
      'an answerable question.',
  },
  {
    slug: 'statistics',
    title: 'Statistics & Probability',
    short: 'Statistics',
    icon: '📊',
    color: '#2563eb',
    level: 'Beginner → Intermediate',
    summary:
      'The statistical core every analyst is expected to know: summarising data, ' +
      'probability, distributions, sampling, confidence intervals, hypothesis tests ' +
      'and A/B testing.',
  },
  {
    slug: 'sql',
    title: 'SQL & Data Wrangling',
    short: 'SQL',
    icon: '🗄️',
    color: '#9333ea',
    level: 'Beginner → Intermediate',
    summary:
      'The language analysts live in. Query fundamentals, joins, aggregation, window ' +
      'functions, cohort/retention analysis and practical data cleaning.',
  },
  {
    slug: 'visualization',
    title: 'Visualization & Storytelling',
    short: 'Visualization',
    icon: '📈',
    color: '#ea580c',
    level: 'Beginner',
    summary:
      'How to choose the right chart, design a dashboard people actually use, and ' +
      'turn a finding into a narrative that drives a decision.',
  },
  {
    slug: 'predictive',
    title: 'Predictive Analytics',
    short: 'Predictive',
    icon: '🤖',
    color: '#0891b2',
    level: 'Intermediate',
    summary:
      'Regression, classification, trees and ensembles, clustering, forecasting and ' +
      'the evaluation metrics that tell you whether a model is worth deploying.',
  },
  {
    slug: 'domains',
    title: 'Applied Business Analytics',
    short: 'Applied',
    icon: '💼',
    color: '#be123c',
    level: 'Intermediate',
    summary:
      'Analytics as it is practised inside functions: marketing, finance, supply ' +
      'chain, people analytics, customer lifetime value and RFM segmentation.',
  },
];

/** Top navigation bar. */
const nav = [
  { label: 'Tracks', href: '/tracks/' },
  { label: 'Tutorials', href: '/tutorials/' },
  { label: 'Practice', href: '/practice/' },
  { label: 'Cheat Sheets', href: '/cheatsheets/' },
  { label: 'Glossary', href: '/glossary/' },
];

module.exports = { site, tracks, nav };
