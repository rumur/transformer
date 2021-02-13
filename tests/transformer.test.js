const { transform } = require('../index');

describe('ensure transformer', () => {

  it('can alias keys on flat object', () => {

    expect(
      transform({ Popular: 15 }).alias({ Popular: 'isPopular' }).toJSON()
    ).toHaveProperty('isPopular', 15);

    expect(
      transform({ Popular: 15 }).alias(new Map([['Popular', 'isPopular']])).toJSON()
    ).toHaveProperty('isPopular', 15);

    expect(
      transform({ Popular: 15 }).useAliasFor('Popular', 'isPopular').toJSON()
    ).toHaveProperty('isPopular', 15);
  });

  it('can alias keys on nested object', () => {

    const source = {
      Category: { Id: 12 }
    };

    expect(
      transform(source).alias({ 'Category.Id': 'cat_id' }).toJSON()
    ).toHaveProperty('Category.cat_id', 12);

    expect(
      transform(source).alias(new Map([['Category.Id', 'cat_id']])).toJSON()
    ).toHaveProperty('Category.cat_id', 12);

    expect(
      transform(source).useAliasFor('Category.Id', 'cat_id').toJSON()
    ).toHaveProperty('Category.cat_id', 12);

  });

  it('can alias keys on nested objects with wildcards', () => {

    const source = {
      Tags: [
        {
          Id: 1,
          Meta: [
            { Id: 1, Name: 'Lorem' },
            { Id: 2, Name: 'Lorem2' },
          ]
        },
        {
          Id: 2,
          Meta: [
            { Id: 1, Name: 'Lorem' },
            { Id: 2, Name: 'Lorem2' },
          ]
        }
      ]
    };

    expect(
      transform(source).alias({ 'Tags.*.Id': 'tag_id' }).toJSON()
    ).toHaveProperty('Tags.0.tag_id', 1);

    expect(
      transform(source).toJSON()
    ).toHaveProperty('Tags.0.Meta.0.Name', 'Lorem');

    expect(
      transform(source).alias(new Map([['Tags.*.Id', 'tag_id']])).toJSON()
    ).toHaveProperty('Tags.1.tag_id', 2);

    expect(
      transform(source).alias({ 'Tags': 'tags', 'Tags.*.Id': 'tag_id' }).toJSON()
    ).toHaveProperty('tags.1.tag_id', 2);

    expect(
      transform(source).useAliasFor('Tags', 'tags').useAliasFor('Tags.*.Id', 'tag_id').toJSON()
    ).toHaveProperty('tags.1.tag_id', 2);

    expect(
      transform(source).alias({ 'Tags.*.Meta.*.Id': 'meta_id' }).toJSON()
    ).toHaveProperty('Tags.0.Meta.0.meta_id', 1);
  });

  it('can transform origin keys with key transformers', () => {
    const source = {
      Tags: [
        {
          Id: 1,
          Meta: [
            { Id: 1, Name: 'Lorem' },
            { Id: 2, Name: 'Lorem2' },
          ]
        },
        {
          Id: 2,
          Meta: [
            { Id: 1, Name: 'Lorem' },
            { Id: 2, Name: 'Lorem2' },
          ]
        }
      ]
    };

    expect(
      transform(source).alias({ 'Tags.*.Id': 'tagId' }).showKeysAsSnakeCase().toJSON()
    ).toHaveProperty('tags.0.tag_id', 1);

    expect(
      transform(source).alias({ 'Tags.*.Id': 'tag_id' }).showKeysAsCamelCase().toJSON()
    ).toHaveProperty('tags.0.tagId', 1);

    expect(
      transform(source)
        .alias({ 'Tags.*.Meta': 'desired_meta', 'Tags.*.Meta.*.Name': 'meta_name' })
        .showKeysAsCamelCase()
        .doNotTransform('Tags.*.Meta.*.Name')
        .toJSON()
    ).toHaveProperty('tags.0.desiredMeta.0.meta_name', 'Lorem');

    expect(
      transform(source).alias({ 'Tags.*.Id': 'TAG_ID' }).showKeysAs((key) => {
        if (/\D/.test(key)) {
          return key.toLowerCase();
        }
        return key;
      }).toJSON()
    ).toHaveProperty('tags.0.tag_id', 1);
  });

  it('can exclude or include desired keys only', () => {
    const source = {
      Tags: [
        {
          Id: 1,
          Meta: [
            { Id: 1, Name: 'Lorem' },
            { Id: 2, Name: 'Lorem2' },
          ]
        },
        {
          Id: 2,
          Meta: [
            { Id: 1, Name: 'Lorem' },
            { Id: 2, Name: 'Lorem2' },
          ]
        }
      ]
    };

    expect(
      transform(source).except('Tags.*.Id').toJSON()
    ).not.toHaveProperty('Tags.0.Id');

    expect(
      transform(source).except('Tags.*.Id').toJSON()
    ).toHaveProperty('Tags.0.Meta');

    expect(
      transform(source).except(['Tags.*.Meta.*.Name']).toJSON()
    ).not.toHaveProperty('Tags.0.Meta.0.Name');

    expect(
      transform(source).except(['Tags.*.Meta.*.Name']).toJSON()
    ).toHaveProperty('Tags.0.Meta.0.Id', 1);

    expect(
      transform(source).except(['Tags.*.Meta.*.Name']).toJSON()
    ).toHaveProperty('Tags.1.Id', 2);

    expect(
      transform(source).only(['Tags.*.Meta.*.Name']).toJSON()
    ).toHaveProperty('Tags.0.Meta.0.Name');

    expect(
      transform(source).only(['Tags.*.Meta.*.Name']).toJSON()
    ).not.toHaveProperty('Tags.0.Id');

    expect(
      transform(source).only(['Tags.*.Meta.*.Name']).toJSON()
    ).toHaveProperty('Tags.0.Meta.0.Name', 'Lorem');
  });

  it('can extend the outcome', () => {
    expect(
      transform({ Popular: 15 }).alias({ Popular: 'isPopular' }).toJSON((payload) => {
        return { ...payload, extended: 2021 };
      })
    ).toEqual({ isPopular: 15, extended: 2021 });

    expect(
      transform([{ Popular: 15 }, { Popular: 20 }]).alias({ Popular: 'isPopular' }).toJSON()
    ).toEqual([{ isPopular: 15 }, { isPopular: 20 }]);
  });
});
