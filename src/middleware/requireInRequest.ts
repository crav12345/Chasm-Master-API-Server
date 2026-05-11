import { Request, RequestHandler, Response } from "express";

export type Options = {
  status?: number;
  message?: string;
  format?: Format;
  optional?: boolean;
};

export type Format = {
  test: (input: unknown, locals: any) => boolean;
  name?: string;
  status?: number;
  message?: string;
  errorSpread?: object;
};

type Prop = "query" | "body" | "params";

export const requireQuery = (query: string, options?: Options) =>
  requireInRequest("query", "query parameter", query, options);

export const requireBody = (body: string, options?: Options) =>
  requireInRequest("body", "body parameter", body, options);

export const requireParam = (param: string, options: Options) =>
  requireInRequest("params", "URL parameter", param, options);

function requireInRequest(
  prop: Prop,
  propName: string,
  input: string,
  options: Options | undefined,
): RequestHandler {
  const {
    status = 400,
    message = `Missing ${propName}: ${input}`,
    optional = false,
    format: {
      test,
      name: formatName,
      status: formatStatus = status,
      message:
        formatMessage = `${propName.charAt(0).toUpperCase() + propName.slice(1)} '${input}' has invalid format${
          formatName ? `: ${formatName}` : ""
        }`,
      errorSpread,
    } = {
      test: () => true,
    },
  }: Options = options ?? {};

  return async (
    req: Request,
    res: Response,
    next: () => any | Promise<any>,
  ) => {
    if (req[prop] === undefined || req[prop][input] === undefined) {
      if (optional) await next();
      else res.status(status).send({ message });
      return;
    }

    if (!test(req[prop][input], res.locals)) {
      res.status(formatStatus).send({ message: formatMessage, ...errorSpread });
      return;
    }

    await next();
  };
}

/** Common formats used for CRUD operations. */
export const formats = {
  objectId: {
    test: (input: unknown) =>
      typeof input === "string" && /^[0-9a-fA-F]{24}$/.test(input),
    name: "MongoDB ObjectId",
  },
  string: {
    test: (input: unknown) => typeof input === "string",
    name: "String",
  },
} as const satisfies FormatCollection;

export type FormatCollection = {
  [key: string]: Format | ((...params: any) => Format);
};
