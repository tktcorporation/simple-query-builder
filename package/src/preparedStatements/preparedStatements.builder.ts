type SQLProperty = string | number;

/**
 * The order is struct
 */
export enum AllowedClause {
    where = 'where',
    offset = 'offset',
    limit = 'limit',
}

export class PreparedStatementsBuilder {
    private _where: SQLProperty[];
    private _offset?: number;
    private _limit?: number;

    constructor(clauses?: {
        where?: SQLProperty[];
        offset?: number;
        limit?: number;
    }) {
        this._where = clauses?.where ?? [];
        this._offset = clauses?.offset;
        this._limit = clauses?.limit;
    }

    build(usedClauses?: Array<AllowedClause>): SQLProperty[] {
        const getSQLProperty = (
            clause: AllowedClause,
        ): SQLProperty[] | undefined => {
            const statement = this[clause];
            if (statement === undefined) return;
            if (typeof statement === 'number') return [statement];
            return statement;
        };
        const clauses: Array<AllowedClause> =
            usedClauses ?? Object.values(AllowedClause);
        return clauses
            .map(clause => getSQLProperty(clause))
            .filter(
                (item): item is Exclude<typeof item, undefined> =>
                    item !== undefined,
            )
            .reduce((p, c) => {
                p.push(...c);
                return p;
            });
    }

    get where(): SQLProperty[] {
        return this._where;
    }
    get offset(): number | undefined {
        return this._offset;
    }
    get limit(): number | undefined {
        return this._limit;
    }

    addWhere(...property: SQLProperty[]): this {
        this._where.push(...property);
        return this;
    }

    setOffset(n: number): this {
        this._offset = n;
        return this;
    }

    setLimit(n: number): this {
        this._limit = n;
        return this;
    }

    startCountOf(usedClauses?: Array<AllowedClause>): number {
        const getCount = (clause: AllowedClause): number | undefined => {
            if (Array.isArray(this[clause])) return this.where.length;
            if (typeof this[clause] == 'number') return 1;
        };
        if (usedClauses === undefined) return 1;
        return (
            1 +
            usedClauses
                .map(clause => getCount(clause) ?? 0)
                .reduce((p, c) => p + c)
        );
    }
}
