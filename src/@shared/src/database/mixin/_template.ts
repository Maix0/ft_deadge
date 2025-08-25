import type { Database } from "./_base";

// never use this directly

// describe every function in the object
export interface ITemplateDb extends Database {
  normalFunction(id: TemplateId): TemplateData | null,
  asyncFunction(id: TemplateId): Promise<TemplateData | null>,
};

export const UserImpl: Omit<ITemplateDb, keyof Database> = {
  /**
   * whole function description
   *
   * @param id the argument description
   *
   * @returns what does the function return ?
   */
  normalFunction(this: ITemplateDb, id: TemplateId): TemplateData | null {
    void id;
    return null;
  },
  /**
   * whole function description
   *
   * @param id the argument description
   *
   * @returns what does the function return ?
   */
  async asyncFunction(this: ITemplateDb, id: TemplateId): Promise<TemplateData | null> {
    void id;
    return null;
  },
};

export type TemplateId = number & { readonly __brand: unique symbol };

export type TemplateData = {
  readonly id: TemplateId;
  readonly name: string;
  readonly password?: string;
};

// this function will be able to be called from everywhere
export async function freeFloatingExportedFunction(): Promise<boolean> {
  return false;
}

// this function will never be able to be called outside of this module
async function privateFunction(): Promise<string | null> {
  return null
}

//silence warnings
void privateFunction;
