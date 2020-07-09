import {
    PreparedStatementsBuilder,
    AllowedClause,
} from './preparedStatements.builder';

describe('PreparedStatementsBuilder', () => {
    describe('addWhere', () => {
        it('one property', () => {
            const builder = new PreparedStatementsBuilder();
            builder.addWhere('taro');
        });
        it('some properties', () => {
            const builder = new PreparedStatementsBuilder();
            builder.addWhere('taro', 1, '1');
            builder.addWhere('2020');
            expect(builder.limit).toBeUndefined();
            expect(builder.offset).toBeUndefined();
            expect(builder.where).toStrictEqual(['taro', 1, '1', '2020']);
            expect(builder.startCountOf()).toBe(1);
            expect(builder.startCountOf([AllowedClause.where])).toBe(5);
            expect(builder.startCountOf([AllowedClause.limit])).toBe(1);
            expect(builder.startCountOf([AllowedClause.offset])).toBe(1);
            expect(
                builder.startCountOf([
                    AllowedClause.where,
                    AllowedClause.offset,
                ]),
            ).toBe(5);
            expect(builder.build()).toStrictEqual(['taro', 1, '1', '2020']);
        });
    });
    describe('setLimit', () => {
        it('one property', () => {
            const builder = new PreparedStatementsBuilder();
            builder.setLimit(10);
            expect(builder.limit).toBe(10);
            expect(builder.offset).toBeUndefined();
            expect(builder.where).toStrictEqual([]);
            expect(builder.startCountOf()).toBe(1);
            expect(builder.startCountOf([AllowedClause.where])).toBe(1);
            expect(builder.startCountOf([AllowedClause.limit])).toBe(2);
            expect(builder.startCountOf([AllowedClause.offset])).toBe(1);
            expect(
                builder.startCountOf([
                    AllowedClause.where,
                    AllowedClause.offset,
                ]),
            ).toBe(1);
            expect(
                builder.startCountOf([
                    AllowedClause.where,
                    AllowedClause.limit,
                ]),
            ).toBe(2);
            expect(builder.build()).toStrictEqual([10]);
        });
        it('some properties', () => {
            const builder = new PreparedStatementsBuilder();
            builder
                .addWhere('taro', 1, '1')
                .addWhere('2020')
                .setLimit(2);
            expect(builder.limit).toBe(2);
            expect(builder.offset).toBeUndefined();
            expect(builder.where).toStrictEqual(['taro', 1, '1', '2020']);
            expect(builder.startCountOf()).toBe(1);
            expect(builder.startCountOf([AllowedClause.where])).toBe(5);
            expect(builder.startCountOf([AllowedClause.limit])).toBe(2);
            expect(builder.startCountOf([AllowedClause.offset])).toBe(1);
            expect(
                builder.startCountOf([
                    AllowedClause.where,
                    AllowedClause.offset,
                ]),
            ).toBe(5);
            expect(
                builder.startCountOf([
                    AllowedClause.where,
                    AllowedClause.limit,
                ]),
            ).toBe(6);
            expect(builder.build()).toStrictEqual(['taro', 1, '1', '2020', 2]);
        });
    });
    describe('setOffset', () => {
        it('one property', () => {
            const builder = new PreparedStatementsBuilder();
            builder.setOffset(3);
            expect(builder.limit).toBeUndefined();
            expect(builder.offset).toBe(3);
            expect(builder.where).toStrictEqual([]);
            expect(builder.startCountOf()).toBe(1);
            expect(builder.startCountOf([AllowedClause.where])).toBe(1);
            expect(builder.startCountOf([AllowedClause.limit])).toBe(1);
            expect(builder.startCountOf([AllowedClause.offset])).toBe(2);
            expect(
                builder.startCountOf([
                    AllowedClause.limit,
                    AllowedClause.offset,
                ]),
            ).toBe(2);
            expect(
                builder.startCountOf([
                    AllowedClause.where,
                    AllowedClause.offset,
                ]),
            ).toBe(2);
            expect(
                builder.startCountOf([
                    AllowedClause.where,
                    AllowedClause.limit,
                ]),
            ).toBe(1);
            expect(builder.build()).toStrictEqual([3]);
        });
        it('some properties', () => {
            const builder = new PreparedStatementsBuilder();
            builder
                .addWhere('taro', 1, '1')
                .addWhere('2020')
                .setOffset(2)
                .setLimit(10);
            expect(builder.limit).toBe(10);
            expect(builder.offset).toBe(2);
            expect(builder.where).toStrictEqual(['taro', 1, '1', '2020']);
            expect(builder.startCountOf()).toBe(1);
            expect(builder.startCountOf([AllowedClause.where])).toBe(5);
            expect(builder.startCountOf([AllowedClause.limit])).toBe(2);
            expect(builder.startCountOf([AllowedClause.offset])).toBe(2);
            expect(
                builder.startCountOf([
                    AllowedClause.limit,
                    AllowedClause.offset,
                ]),
            ).toBe(3);
            expect(
                builder.startCountOf([
                    AllowedClause.where,
                    AllowedClause.offset,
                ]),
            ).toBe(6);
            expect(
                builder.startCountOf([
                    AllowedClause.where,
                    AllowedClause.limit,
                ]),
            ).toBe(6);
            expect(builder.build()).toStrictEqual([
                'taro',
                1,
                '1',
                '2020',
                2,
                10,
            ]);
        });
    });
});
