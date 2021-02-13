'use strict';

const Transformer = require('./src/transformer');

/**
 * Creates a transformer for a source.
 *
 * @param {object|object[]}source
 * @return {Transformer}
 */
const transform = (source) => {
  return ( new Transformer ).useSource(source);
};

module.exports = { transform, Transformer };
