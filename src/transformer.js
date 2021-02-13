'use strict';

const _ = require('lodash');

class Transformer {
  /**
   * The Origin source.
   *
   * @protected
   * @type {Object|Object[]}
   */
  _origin = {};

  /**
   * Set of attributes that should be skipped from the `toJSON` method.
   *
   * @example:
   *  new Set(['pass']);
   * @type {Set<string>}
   * @protected
   */
  _except = new Set;

  /**
   * Set of attributes that should be shown after `toJSON` method.
   *
   * @example:
   *  new Set(['pass']);
   * @type {Set<string>}
   * @protected
   */
  _only = new Set;

  /**
   * Set of attributes that should be shown as they were placed in the origin.
   *
   * @example:
   *  new Set(['pass']);
   * @type {Set<string>}
   * @protected
   */
  _keepOrigin = new Set;

  /**
   * The key transformer, could be used instead of the aliases.
   * Instead of adding the bunch of aliases you can just tell how do you want to transform all keys in general.
   *
   * @example:
   *  custom (key) => _.upperFirst( _.camelCase(key) ) = foo-bar|fooBar|foo_bar -> FooBar
   * @type {?function}
   * @protected
   */
  _keyTransformer;

  /**
   * Aliases the origin attributes to a desired ones.
   *
   * @example:
   *  new Map([
   *    ['Id', 'id'], -> aliased as `id`
   *    ['Name', 'name'],
   *    ['Won', 'isWon'], -> aliased as `isWon`
   *    ['Password', 'pass'],
   *    ['UpdateDate', 'date'], -> aliased as `date`
   *    ['Tags.*.infos', 'inf'], -> aliased as `Tags.*.inf`
   *    ['Tags.*.infos.*.title', 'label'], -> aliased as `Tags.*.infos.*.label`
   *  ]);
   * @type {Map<string, string>}
   * @protected
   */
  _aliases = new Map;

  /**
   * Sets the source.
   *
   * @param {Object|Object[]} source The resource that need to be transformed.
   * @return {this}
   */
  useSource(source) {
    this._origin = source || {};

    return this;
  }

  /**
   * Adds a list of keys to a collection that should remain untouched.
   *
   * @param {string|string[]} keys
   * @return {Transformer}
   */
  doNotTransform(keys) {
    const attrs = Array.isArray(keys) ? keys : [keys];

    this._keepOrigin = new Set(Array.from(this._keepOrigin).concat(attrs));

    return this;
  }

  /**
   * Adds a list of keys to a collection that should be skipped.
   *
   * @param {string|string[]} keys
   * @return {Transformer}
   */
  except(keys) {
    const attrs = Array.isArray(keys) ? keys : [keys];

    this._except = new Set(Array.from(this._except).concat(attrs));

    return this;
  }

  /**
   * Adds a list of keys to a collection that should be shown.
   *
   * @param {string|string[]} keys
   * @return {Transformer}
   */
  only(keys) {
    const attrs = Array.isArray(keys) ? keys : [keys];

    this._only = new Set(Array.from(this._only).concat(...attrs.map(piece => {
      const nestedOptions = [
        /[*]/.test(piece), // e.g. Tags.*.Id
        /[.]/.test(piece), // e.g. Category.Name
      ];

      if (nestedOptions.some(isTrue => isTrue)) {

        const [isWildCard] = nestedOptions;

        const separator = isWildCard ? '.*.' : '.';

        // if there is a nested or wildcard path
        // We need to add each parent to `only` as well
        // e.g. we got a piece that looks like this `Tags.*.infos.*.title`
        // in this case in order to allow recreate the path in a result
        // we need also to add `Tags` and `Tags.*.infos` to the `only` collection.
        return piece.split(separator).reduce((options, option) => {

          if (!options.length) {
            return [option];
          }

          // Taking the last and combining with current option.
          const path = [[...options].pop(), option].join(separator);

          return options.concat(path);
        }, []);
      }

      return piece;
    })));

    return this;
  }

  /**
   * Adds aliases for source keys.
   *
   * @param {Object|Map} aliases The list of desired aliases where the key is a origin path.
   * @example:
   *  {
   *    'Popularity': 'isPopular',
   *    'Category.Id': 'cat_id',
   *    'src._Id': '_ID',
   *    'Tags.*.infos': 'inf',
   *    'Tags.*.infos.*.title': 'label',
   *  }
   * @example:
   *  new Map([
   *    ['Popularity', 'isPopular'],
   *    ['Category.Id', 'cat_id'],
   *    ['src._Id', '_ID'],
   *    ['Tags.*.infos', 'inf'],
   *    ['Tags.*.infos.*.title', 'label'],
   *  ])
   *
   * @return {Transformer}
   */
  alias(aliases) {
    if (aliases instanceof Map) {
      this._aliases = new Map(Array.from(this._aliases).concat(Array.from(aliases)));
    } else if (_.isPlainObject(aliases)) {
      _.forEach(aliases, (alias, origin) => {
        this._aliases.set(origin, alias);
      });
    }

    return this;
  }

  /**
   * Extends existing aliases.
   *
   * @param {string} origin The origin attribute name that need to be aliased for a view.
   * @param {string} alias  The desired alias name within the view.
   * @return {this}
   */
  useAliasFor(origin, alias) {
    this._aliases.set(origin, alias);

    return this;
  }

  /**
   * Gets the aliased key for an origin key.
   * If there is no alias for a ley the origin will be returned.
   *
   * @param {string} key
   * @return {string|*}
   */
  aliasTheKey(key) {
    if (this._aliases.has(key)) {
      return this._aliases.get(key);
    }
    // Taking the current piece of the key path.
    return _.toPath(key).pop();
  }

  /**
   * Adds a key transformer.
   *
   * @param {function} cb
   * @return {this}
   */
  showKeysAs(cb) {
    this._keyTransformer = cb;

    return this;
  }

  /**
   * Helps to set keys with more descriptive way.
   *
   * @return {this}
   */
  showKeysAsCamelCase() {
    return this.showKeysAs((key) => _.camelCase(key));
  }

  /**
   * Helps to set keys with more descriptive way.
   *
   * @return {this}
   */
  showKeysAsSnakeCase() {
    return this.showKeysAs((key) => _.snakeCase(key));
  }

  /**
   * Gets the transformed key.
   * If there is no a key transformer the origin will be returned.
   *
   * @param {string} key
   * @return {string|*}
   */
  transformTheKey(key) {
    if (typeof this._keyTransformer === 'function') {
      return this._keyTransformer.call(null, key);
    }

    return key;
  }

  /**
   * Transforms the target source.
   *
   * @param {Object} target
   * @param {?string} path
   */
  transform(target, path = null) {
    // If it's not a plain object returning it as it's
    // However if it's an object we need to apply all aliases and transformer to it.
    if (!_.isObject(target)) {
      return target;
    }

    return Object.keys(target).reduce((result, keyOrigin) => {
      const keyPath = [path, keyOrigin].filter(pk => !!pk).join('.');

      // Takes the only keys we asked for.
      if (this._only.size && !this._only.has(keyPath)) {
        return result;
      }

      // Excluding keys.
      if (this._except.has(keyPath)) {
        return result;
      }

      const keyAlias = this.aliasTheKey(keyPath);
      const keyFinal = this._keepOrigin.has(keyPath) ? keyAlias : this.transformTheKey(keyAlias);

      let value = _.get(target, keyOrigin);

      // In order to nested transformers or Sequelize hydrated function.
      if (value && typeof value.toJSON === 'function') {
        value = value.toJSON();
      }

      if (Array.isArray(value)) {
        value = value.map(item => this.transform(item, `${ keyPath }.*`));
      } else {
        value = this.transform(value, keyPath);
      }

      return _.set(result, keyFinal, value);
    }, {});
  }

  /**
   * Represents the result of transformation as a json string.
   *
   * @return {string}
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }

  /**
   * Transforms the origin source to the final version.
   *
   * @param {?function} cb
   * @return {{}|*}
   */
  toJSON(cb = null) {
    let target = this._origin;

    if (typeof cb === 'function') {
      target = cb(this._origin);
    }

    if (Array.isArray(target)) {
      target = target.map(origin => this.transform(origin));
    } else {
      target = this.transform(target);
    }

    return target;
  }
}

module.exports = Transformer;
