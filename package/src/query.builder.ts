import {
    PreparedStatementsBuilder,
    AllowedClause,
} from './preparedStatements/preparedStatements.builder';
export enum Clause {
    where = 'WHERE',
    offset = 'OFFSET',
    limit = 'LIMIT',
    from = 'FROM',
    select = 'SELECT',
    orderBy = 'ORDER BY',
}
enum OrderMappings {
    asc = 'ASC',
    desc = 'DESC',
}
interface FieldValueMapping {
    field: string;
    value: SQLProperty;
}
interface FieldAscendingMapping {
    field: string;
    isAscending: boolean;
}
export interface QueryWithPreparedStates {
    query: string;
    preparedStatements: Array<SQLProperty>;
}
type SQLProperty = string | number;

export class QueryBuilder {
    private readonly baseQuery?: string;
    private selectQuery: string[] = [];
    private fromAndJoinQuery?: string;
    private whereEqualMappings: Array<FieldValueMapping> = [];
    private _offset?: number;
    private _limit?: number;
    private orderQuery: FieldAscendingMapping[] = [];
    private endQuery: string[] = [];

    /**
     *
     * @param query Query string of start excluding prepared statements
     */
    constructor(query?: string) {
        this.baseQuery = query?.trim();
        if (this.baseQuery && /.+;$/.test(this.baseQuery))
            this.baseQuery = this.baseQuery.slice(0, -1);
    }

    /**
     * Add a field of select section.  Multi callable.
     * @param query of from and join section. (ex. "NAME" as name)
     */
    select(query: string): this {
        const trimed = query.trim();
        if (/.+(;|,)$/.test(trimed)) {
            this.selectQuery.push(trimed.slice(0, -1));
            return this;
        }
        this.selectQuery.push(trimed);
        return this;
    }

    /**
     * Add a query of from and join section.
     * @param query Query of from and join section.
     */
    from(query: string): this {
        const trimed = query.trim();
        if (/.+(;|,)$/.test(trimed)) {
            this.fromAndJoinQuery = trimed.slice(0, -1);
            return this;
        }
        this.fromAndJoinQuery = trimed;
        return this;
    }

    /**
     *  Add a field of where section.  Multi callable.
     * @param field (ex. "NAME")
     * @param value (ex. 'John')
     */
    whereEqual(field: string, value: SQLProperty): this {
        this.whereEqualMappings.push({ field, value });
        return this;
    }
    /**
     *  Add a field of where section. and ignore undefined value.
     * Multi callable.
     * @param field (ex. "NAME")
     * @param value (ex. 'John')
     */
    whereEqualEscapeUndefined(
        field: string,
        value: SQLProperty | undefined,
    ): this {
        if (value === undefined) return this;
        return this.whereEqual(field, value);
    }
    addQueryToEnd(query?: string): this {
        if (query === undefined) return this;
        const trimed = query.trim();
        if (/.+;$/.test(trimed)) {
            this.endQuery.push(trimed.slice(0, -1));
            return this;
        }
        this.endQuery.push(trimed);
        return this;
    }

    order(field: string, isAsc: boolean): this {
        this.orderQuery.push({
            field,
            isAscending: isAsc,
        });
        return this;
    }
    orderEscapeUndefined(field: string, isAsc?: boolean): this {
        if (isAsc === undefined) return this;
        return this.order(field, isAsc);
    }

    offset(n: number): this {
        this._offset = n;
        return this;
    }

    limit(n: number): this {
        this._limit = n;
        return this;
    }
    /**
     * ignore undefined.
     * @param n
     */
    limitEscapeUndefined(n?: number): this {
        if (n === undefined) return this;
        this._limit = n;
        return this;
    }

    build(): QueryWithPreparedStates {
        const {
            base,
            select,
            fromAndJoin,
            order,
            endQuery,
            preparedStatements,
        } = this.preBuild();
        const queries: Array<string | undefined> = [
            base,
            select,
            fromAndJoin,
            this.createWhereString(preparedStatements.startCountOf()),
            order,
            this.createOffsetString(
                preparedStatements.startCountOf([AllowedClause.where]),
            ),
            this.createLimitString(
                preparedStatements.startCountOf([
                    AllowedClause.where,
                    AllowedClause.offset,
                ]),
            ),
            ...endQuery,
        ];
        return {
            query:
                queries
                    .filter(
                        (item): item is Exclude<typeof item, undefined> =>
                            item !== undefined,
                    )
                    .join(' ') + ';',
            preparedStatements: preparedStatements.build(),
        };
    }

    /**
     * Build a query for return a total count of found rows as "found"
     */
    buildForCount(): QueryWithPreparedStates {
        const {
            base,
            fromAndJoin,
            endQuery,
            preparedStatements,
        } = this.preBuild();
        const queries: Array<string | undefined> = [
            base,
            QueryBuilder.countSelectString,
            fromAndJoin,
            this.createWhereString(preparedStatements.startCountOf()),
            QueryBuilder.oneLimitString,
            ...endQuery,
        ];
        return {
            query:
                queries
                    .filter(
                        (item): item is Exclude<typeof item, undefined> =>
                            item !== undefined,
                    )
                    .join(' ') + ';',
            preparedStatements: preparedStatements.build([AllowedClause.where]),
        };
    }

    preBuild(): {
        base?: string;
        select?: string;
        fromAndJoin?: string;
        order?: string;
        endQuery: string[];
        preparedStatements: PreparedStatementsBuilder;
    } {
        const preparedStatements = new PreparedStatementsBuilder();
        const base = this.baseQuery;
        const select = this.createSelectString();
        const fromAndJoin = this.createFromString();
        preparedStatements.addWhere(
            ...this.whereEqualMappings.map(v => v.value),
        );
        const order = this.createOrderString();
        if (this._offset) preparedStatements.setOffset(this._offset);
        if (this._limit) preparedStatements.setLimit(this._limit);
        const endQuery = this.endQuery;

        return {
            base,
            select,
            fromAndJoin,
            order,
            endQuery,
            preparedStatements,
        };
    }

    private createSelectString = (): string | undefined => {
        if (this.selectQuery.length < 1) return;
        return QueryBuilder.createSelectString(this.selectQuery.join(', '));
    };

    private createLimitString = (
        initialPreparedCount = 0,
    ): string | undefined => {
        const limit = this._limit;
        if (!limit) return;
        return QueryBuilder.createLimitString(`$${initialPreparedCount}`);
    };

    private createOffsetString = (
        initialPreparedCount = 0,
    ): string | undefined => {
        const offset = this._offset;
        if (!offset) return;
        return QueryBuilder.createOffsetString(`$${initialPreparedCount}`);
    };

    private createFromString(): string | undefined {
        const from = this.fromAndJoinQuery;
        if (!from) return;
        return QueryBuilder.createFromString(from);
    }

    private createOrderString(): string | undefined {
        if (this.orderQuery.length < 1) return;
        return QueryBuilder.createOrderString(
            this.orderQuery
                .map(mapping =>
                    [
                        mapping.field,
                        QueryBuilder.createOrderDirString(mapping.isAscending),
                    ].join(' '),
                )
                .join(', '),
        );
    }

    private createWhereString(initialPreparedCount = 0): string | undefined {
        if (this.whereEqualMappings.length < 1) return;
        return QueryBuilder.createWhereString(
            this.whereEqualMappings
                .map((v, i) => `${v.field} = $${initialPreparedCount + i}`)
                .join(' AND '),
        );
    }

    private static get countSelectString(): string {
        return QueryBuilder.createSelectString('count(*) OVER() as found');
    }

    private static get oneLimitString(): string {
        return QueryBuilder.createLimitString(1);
    }

    private static createOffsetString = (n: number | string): string =>
        [Clause.offset, n].join(' ');
    private static createWhereString = (str: string): string =>
        [Clause.where, str].join(' ');
    private static createLimitString = (n: number | string): string =>
        [Clause.limit, n].join(' ');
    private static createFromString = (str: string): string =>
        [Clause.from, str].join(' ');
    private static createSelectString = (str: string): string =>
        [Clause.select, str].join(' ');
    private static createOrderString = (str: string): string =>
        [Clause.orderBy, str].join(' ');
    private static createOrderDirString = (isAsc: boolean): string =>
        isAsc ? OrderMappings.asc : OrderMappings.desc;
}
