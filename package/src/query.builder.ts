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
    preparedStates: Array<SQLProperty>;
}
type SQLProperty = string | number;

export class QueryBuilder {
    private readonly baseQuery?: string;
    private selectQuery: string[] = [];
    private fromAndJoinQuery?: string;
    private whereEqualMappings: Array<FieldValueMapping> = [];
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
            where,
            order,
            limit,
            endQuery,
            preparedStates,
        } = this.preBuild();
        return {
            query:
                [base, select, fromAndJoin, where, order, limit, ...endQuery]
                    .filter(
                        (item): item is Exclude<typeof item, undefined> =>
                            item !== undefined,
                    )
                    .join(' ') + ';',
            preparedStates,
        };
    }

    /**
     * Build a query for return a total count of found rows as "found"
     */
    buildForCount(): QueryWithPreparedStates {
        const {
            base,
            fromAndJoin,
            where,
            endQuery,
            preparedStates,
        } = this.preBuild();
        return {
            query:
                [
                    base,
                    QueryBuilder.countSelectString,
                    fromAndJoin,
                    where,
                    QueryBuilder.oneLimitString,
                    ...endQuery,
                ]
                    .filter(
                        (item): item is Exclude<typeof item, undefined> =>
                            item !== undefined,
                    )
                    .join(' ') + ';',
            preparedStates,
        };
    }

    preBuild(): {
        base?: string;
        select?: string;
        fromAndJoin?: string;
        where?: string;
        order?: string;
        limit?: string;
        endQuery: string[];
        preparedStates: SQLProperty[];
    } {
        const preparedStates: SQLProperty[] = [];
        const base = this.baseQuery;
        const select = this.createSelectString();
        const fromAndJoin = this.createFromString();
        const preWhere = this.createWhereString(preparedStates.length);
        const where = preWhere?.query;
        if (preWhere?.preparedStates !== undefined)
            preparedStates.push(...preWhere.preparedStates);
        const order = this.createOrderString();
        const limit = this.createLimitString();
        const endQuery = this.endQuery;

        return {
            base,
            select,
            fromAndJoin,
            where,
            order,
            limit,
            endQuery,
            preparedStates,
        };
    }

    private createSelectString = (): string | undefined => {
        if (this.selectQuery.length < 1) return;
        return QueryBuilder.createSelectString(this.selectQuery.join(', '));
    };

    private static get countSelectString(): string {
        return QueryBuilder.createSelectString('count(*) OVER() as found');
    }

    private static get oneLimitString(): string {
        return QueryBuilder.createLimitString(1);
    }

    private createLimitString(): string | undefined {
        const limit = this._limit;
        if (!limit) return;
        return QueryBuilder.createLimitString(limit);
    }

    private createFromString(): string | undefined {
        const from = this.fromAndJoinQuery;
        if (!from) return;
        return QueryBuilder.createFromString(from);
    }

    private createOrderString(): string | undefined {
        if (this.orderQuery.length < 1) return;
        return QueryBuilder.createOrderString(
            this.orderQuery
                .map((mapping) =>
                    [
                        mapping.field,
                        QueryBuilder.createOrderDirString(mapping.isAscending),
                    ].join(' '),
                )
                .join(' '),
        );
    }

    private createWhereString = (
        initialPreparedCount = 0,
    ): QueryWithPreparedStates | undefined => {
        if (Object.values(this.whereEqualMappings).length < 1) return;
        const property = this.createWhereProperties(initialPreparedCount);
        return {
            query: `WHERE ${property.propertiesString}`,
            preparedStates: property.preparedStates,
        };
    };

    private createWhereProperties = (initialPreparedCount = 0) => ({
        propertiesString: this.whereEqualMappings
            .map((v, i) => `${v.field} = $${initialPreparedCount + i + 1}`)
            .join(' AND '),
        preparedStates: this.whereEqualMappings.map((v) => v.value),
    });

    private static createLimitString(n: number): string {
        return ['LIMIT', n].join(' ');
    }
    private static createFromString(str: string): string {
        return ['FROM', str].join(' ');
    }
    private static createSelectString(str: string): string {
        return ['SELECT', str].join(' ');
    }
    private static createOrderString(str: string): string {
        return ['ORDER', 'BY', str].join(' ');
    }
    private static createOrderDirString(isAsc: boolean): string {
        return isAsc ? OrderMappings.asc : OrderMappings.desc;
    }
}
