import { QueryBuilder } from './query.builder';

describe('QueryBuilder', () => {
    describe('build', () => {
        it('base', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"').build();
            expect(query.preparedStatements).toStrictEqual([]);
            expect(query.query).toBe('SELECT * FROM "USERS";');
        });
        it('base with semi-colon', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS";').build();
            expect(query.preparedStatements).toStrictEqual([]);
            expect(query.query).toBe('SELECT * FROM "USERS";');
        });
        it('base with white space', () => {
            const query = new QueryBuilder('  SELECT * FROM "USERS"; ').build();
            expect(query.preparedStatements).toStrictEqual([]);
            expect(query.query).toBe('SELECT * FROM "USERS";');
        });
        it('whereEqual', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .build();
            expect(query.preparedStatements).toStrictEqual(['taro']);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1;`,
            );
        });
        it('whereEqual', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .build();
            expect(query.preparedStatements).toStrictEqual(['taro']);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1;`,
            );
        });
        it('whereEqualEscapeUndefined', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', undefined)
                .build();
            expect(query.preparedStatements).toStrictEqual(['taro']);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1;`,
            );
        });
        it('whereEqualEscapeUndefined', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', 1)
                .build();
            expect(query.preparedStatements).toStrictEqual(['taro', 1]);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2;`,
            );
        });
        it('addQueryToEnd', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', 1)
                .build();
            expect(query.preparedStatements).toStrictEqual(['taro', 1]);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2;`,
            );
        });
        describe('offset', () => {
            it('select, from, where, offset, limit', () => {
                const query = new QueryBuilder()
                    .select('*')
                    .from('"USERS"')
                    .whereEqual('"name"', 'taro')
                    .whereEqualEscapeUndefined('"age"', 1)
                    .offset(2)
                    .limit(1)
                    .build();
                expect(query.preparedStatements).toStrictEqual([
                    'taro',
                    1,
                    2,
                    1,
                ]);
                expect(query.query).toBe(
                    `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2 OFFSET $3 LIMIT $4;`,
                );
            });
            it('select, from, offset', () => {
                const query = new QueryBuilder()
                    .select('*')
                    .from('"USERS"')
                    .offset(2)
                    .build();
                expect(query.preparedStatements).toStrictEqual([2]);
                expect(query.query).toBe(`SELECT * FROM "USERS" OFFSET $1;`);
            });
            it('select, from, offset', () => {
                const query = new QueryBuilder()
                    .select('*')
                    .from('"USERS"')
                    .offset(2)
                    .buildForCount();
                expect(query.preparedStatements).toStrictEqual([]);
                expect(query.query).toBe(
                    `SELECT count(*) OVER() as found FROM "USERS" LIMIT 1;`,
                );
            });
        });

        it('Limit', () => {
            const query = new QueryBuilder()
                .select('*')
                .from('"USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', 1)
                .limit(1)
                .build();
            expect(query.preparedStatements).toStrictEqual(['taro', 1, 1]);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2 LIMIT $3;`,
            );
        });
        it('Order', () => {
            const query = new QueryBuilder()
                .select('*')
                .from('"USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', 1)
                .order('"age"', true)
                .limit(1)
                .build();
            expect(query.preparedStatements).toStrictEqual(['taro', 1, 1]);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2 ORDER BY "age" ASC LIMIT $3;`,
            );
        });
        it('Order by two columns', () => {
            const query = new QueryBuilder()
                .select('*')
                .from('"USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', 1)
                .order('"age"', true)
                .order('"name"', false)
                .limit(1)
                .build();
            expect(query.preparedStatements).toStrictEqual(['taro', 1, 1]);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2 ORDER BY "age" ASC, "name" DESC LIMIT $3;`,
            );
        });
        it('buildForCount', () => {
            const query = new QueryBuilder()
                .select('*')
                .from('"USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', 1)
                .order('"age"', true)
                .limit(1)
                .buildForCount();
            expect(query.preparedStatements).toStrictEqual(['taro', 1]);
            expect(query.query).toBe(
                `SELECT count(*) OVER() as found FROM "USERS" WHERE "name" = $1 AND "age" = $2 LIMIT 1;`,
            );
        });
    });
});
