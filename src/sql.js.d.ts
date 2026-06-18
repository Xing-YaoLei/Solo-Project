declare module 'sql.js' {
	export interface SqlJsStatic {
		Database: new (data?: Uint8Array | ArrayBuffer | Buffer | number[] | null) => SqlJsDatabase;
	}

	export interface SqlJsDatabase {
		exec(sql: string, params?: SqlJsBindParams): QueryExecResult[];
		run(sql: string, params?: SqlJsBindParams): SqlJsDatabase;
		prepare(sql: string): unknown;
		export(): Uint8Array;
		close(): void;
		getRowsModified?(): number;
	}

	export type SqlJsBindParams = unknown[] | Record<string, unknown>;

	export interface QueryExecResult {
		columns: string[];
		values: unknown[][];
	}

	function initSqlJs(): Promise<SqlJsStatic>;

	export default initSqlJs;
}
