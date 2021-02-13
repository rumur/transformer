# JS Objects Transformer
Simple Transformer for JS Objects.

## Overview

This library was created to solve the problem of making an Object and collection of Objects to have a standard look.
It can transform the data model or a datasource and exclude or take only specific keys and also can alias them with a completely different names.

## Getting Started

### Installation

Installation is simple, use npm to install.
Right now, this is a node targeted project.

```shell
$ npm install https://github.com/rumur/transformer#semver:1.0.0 --save
```

That's it!

### alias

Given an array of property names, the resulting object will only contain the supplied properties.

**Example**

```js
const { transform } = require('@rumur/transformer');

transform({ Popular: 15 }).alias({ Popular: 'isPopular' }).toJSON();

// result = { isPopular: 15 }
```

```js
const { transform } = require('@rumur/transformer');

const result = transform({ Category: { Id: 12 } }).alias({ 'Category.Id': 'cat_id' }).toJSON()

// result = { Category: { cat_id: 12 } }
```

```js
const { transform } = require('@rumur/transformer');

const result = transform({
  Tags: [{
    Id: 1,
    Meta: [
      { Id: 1, Name: 'Lorem' },
    ]
  }]
}).alias({
  'Tags': 'tags',
  'Tags.*.Id': 'tag_id',
  'Tags.*.Meta': 'meta',
  'Tags.*.Meta.*.Id': 'meta_id',
  'Tags.*.Meta.*.Name': 'meta_name',
}).toJSON();

// result = { tags: [ { tag_id: 1, meta: [ { meta_id: 1, meta_name: 'Lorem' } ] } };
```

### showKeysAsCamelCase

**Example**
```js
const { transform } = require('@rumur/transformer');

const result = transform({
  Tags: [{
    Id: 1,
    Meta: [
      { Id: 1, Name: 'Lorem' },
    ]
  }]
}).alias({
  'Tags': 'tags',
  'Tags.*.Id': 'tag_id',
  'Tags.*.Meta': 'meta',
  'Tags.*.Meta.*.Id': 'meta_id',
  'Tags.*.Meta.*.Name': 'meta_name',
}).showKeysAsCamelCase().toJSON();

// result = { tags: [ { tagId: 1, meta: [ { metaId: 1, metaName: 'Lorem' } ] } };
```

### showKeysAsCamelCase

**Example**
```js
const { transform } = require('@rumur/transformer');

const result = transform({
  Tags: [{
    Id: 1,
    Meta: [
      { _metaId: 1, metaName: 'Lorem' },
    ]
  }]
}).showKeysAsSnakeCase().toJSON();

// result = { tags: [ { id: 1, meta: [ { meta_id: 1, meta_name: 'Lorem' } ] } };
```

### doNotTransform
If you need to transform all keys, but keep only specific ones untouched,
just pass the path of the key/keys you want to ignore, but you still can alias those keys.

**Example**
```js
const { transform } = require('@rumur/transformer');

const result = transform({
  Tags: [{
    Id: 1,
    Meta: [
      { _metaId: 1, metaName: 'Lorem' },
    ]
  }]
}).showKeysAsSnakeCase().doNotTransform('Tags.*.Meta.*._metaId').toJSON();

// result = { tags: [ { id: 1, meta: [ { _metaId: 1, meta_name: 'Lorem' } ] } };
```

### showKeysAs
In order to create your own key transformer, in this case just add your own function which will handle this process.

**Example**

```js
const _ = require('lodash');
const { transform } = require('@rumur/transformer');

const result = transform({
  Tags: [{
    Id: 1,
    Meta: [
      { _metaId: 1, metaName: 'Lorem' },
    ]
  }]
}).showKeysAs((key) => _.upperFirst(_.camelCase(key))).doNotTransform('Tags.*.Meta.*._metaId').toJSON();

// result = { Tags: [ { Id: 1, Meta: [ { _metaId: 1, MetaName: 'Lorem' } ] } };
```

### except
In case if you want to exclude some specific keys from the source you have got.

```js
const { transform } = require('@rumur/transformer');

const result = transform({
  Tags: [{
    Id: 1,
    Meta: [
      { Id: 1, Name: 'Lorem' },
    ]
  }]
}).showKeysAsSnakeCase().except(['Tags.*.Meta.*.Name']).toJSON();

// result = { tags: [ { id: 1, meta: [ { id: 1 } ] } };
```

### only
In case if you want to include some specific keys only from the source.

```js
const { transform } = require('@rumur/transformer');

const result = transform({
  Tags: [{
    Id: 1,
    Meta: [
      { Id: 1, Name: 'Lorem' },
      { Id: 2, Name: 'Lorem2' },
    ]
  }]
}).showKeysAsSnakeCase().only(['Tags.*.Meta.*.Name']).toJSON();

// result = { tags: [ { meta: [ { name: 'Lorem' }, { name: 'Lorem2' } ] } };
```

### toJSON
In case if you want to extend or do some diff logic.

```js
const { transform } = require('@rumur/transformer');

const result = transform({
  Tags: [{
    Id: 1,
    Meta: [
      { Id: 1, Name: 'Lorem' },
    ]
  }]
}).showKeysAsSnakeCase().toJSON((payload) => {
  return { ...payload, NewYear: 2021 };
});

// result = { tags: [ { meta: [ { name: 'Lorem' } ] }, new_year: 2021 };
```
