const safeParseJson = (input: string | object) => {
  if (typeof input === "object") {
    return input;
  }

  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
};

export const parseStreamLine = <T = Record<string, unknown>>(
  input: string | string[] | object,
): T[] => {
  if (typeof input === "object" && !Array.isArray(input)) {
    return [input as T];
  }

  const splittedString = Array.isArray(input)
    ? input.flatMap((v) => {
        return parseStreamLine(v) as T | T[];
      })
    : input.split(/\r?\n/);

  return splittedString.filter(Boolean).map((v) => {
    return safeParseJson(v as string | object) as T;
  });
};
