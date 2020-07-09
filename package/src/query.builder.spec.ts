import { QueryBuilder } from './query.builder';

describe('QueryBuilder', () => {
    describe('build', () => {
        it('base', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"').build();
            expect(query.preparedStates).toStrictEqual([]);
            expect(query.query).toBe('SELECT * FROM "USERS";');
        });
        it('base with semi-colon', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS";').build();
            expect(query.preparedStates).toStrictEqual([]);
            expect(query.query).toBe('SELECT * FROM "USERS";');
        });
        it('base with white space', () => {
            const query = new QueryBuilder('  SELECT * FROM "USERS"; ').build();
            expect(query.preparedStates).toStrictEqual([]);
            expect(query.query).toBe('SELECT * FROM "USERS";');
        });
        it('whereEqual', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .build();
            expect(query.preparedStates).toStrictEqual(['taro']);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1;`,
            );
        });
        it('whereEqual', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .build();
            expect(query.preparedStates).toStrictEqual(['taro']);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1;`,
            );
        });
        it('whereEqualEscapeUndefined', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', undefined)
                .build();
            expect(query.preparedStates).toStrictEqual(['taro']);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1;`,
            );
        });
        it('whereEqualEscapeUndefined', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', 1)
                .build();
            expect(query.preparedStates).toStrictEqual(['taro', 1]);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2;`,
            );
        });
        it('addQueryToEnd', () => {
            const query = new QueryBuilder('SELECT * FROM "USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', 1)
                .build();
            expect(query.preparedStates).toStrictEqual(['taro', 1]);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2;`,
            );
        });
        it('Limit', () => {
            const query = new QueryBuilder()
                .select('*')
                .from('"USERS"')
                .whereEqual('"name"', 'taro')
                .whereEqualEscapeUndefined('"age"', 1)
                .limit(1)
                .build();
            expect(query.preparedStates).toStrictEqual(['taro', 1]);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2 LIMIT 1;`,
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
            expect(query.preparedStates).toStrictEqual(['taro', 1]);
            expect(query.query).toBe(
                `SELECT * FROM "USERS" WHERE "name" = $1 AND "age" = $2 ORDER BY "age" ASC LIMIT 1;`,
            );
        });
    });
});
