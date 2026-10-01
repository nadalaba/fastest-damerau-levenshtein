export function pad(
  str: string,
  totalLength: number = 80,
  symbol: string = "=",
  colorSymbol?: string,
) {
  const padLength = totalLength - str.length;

  if (padLength <= 0) return str;

  const resetSymbol = colorSymbol ? "\x1b[0m" : "";
  colorSymbol ??= "";

  const left = symbol.repeat(Math.floor(padLength / 2));
  const right = symbol.repeat(Math.ceil(padLength / 2));

  const sections = [left, str, right];

  for (let i = 0; i < sections.length; i++) {
    if (sections[i] !== "") sections[i] = colorSymbol + sections[i] + resetSymbol;
  }

  return sections.join("");
}

export function toString(
  s1: number[] | string[],
  s2: number[] | string[],
  matrix: number[][] | ((i: number, j: number) => number),
): string {
  function getMatrix(): number[][] {
    if (Array.isArray(matrix)) {
      return matrix;
    } else if (typeof matrix === "function") {
      const isRowDefined = (row: number): boolean => {
        let firstRowValue = undefined;
        try {
          firstRowValue = matrix(row, 1);
        } catch (e) {
          if (
            typeof e === "object" &&
            e !== null &&
            "message" in e &&
            typeof e?.message === "string" &&
            e.message.includes("Cannot read properties of undefined")
          )
            firstRowValue = undefined;
          else throw e;
        }
        return firstRowValue !== undefined;
      };
      const mat: number[][] = [[0]];
      let v = 0;
      let j = 1;
      while (matrix(1, j) !== undefined) mat[0].push(matrix(0, j++));
      let i = 1;
      while (isRowDefined(i)) {
        mat[i] = [];
        j = 0;
        while ((v = matrix(i, j++)) !== undefined) mat[i].push(v);
        i++;
      }
      return mat;
    } else {
      throw Error("matrix is not an array of a function");
    }
  }
  const codePointToString = (cp: number | string): string =>
    typeof cp === "number" && (cp | 0) === cp && cp >= 0 && cp < 0x110000
      ? String.fromCodePoint(cp)
      : cp.toString();
  const str1 = [" ", ...s1].map((cp) => codePointToString(cp));
  const str2 = [" ", ...s2].map((cp) => codePointToString(cp));
  const maxCharWidth = [...str1, ...str2].reduce(
    (acc, curr) => ([...curr].length > acc ? [...curr].length : acc),
    0,
  );
  const innerCellWidth = maxCharWidth + 2;
  const mat = getMatrix();
  const height = Math.max(mat.length, str1.length);
  const width = Math.max(mat[0].length, str2.length);
  let str = " ".repeat(innerCellWidth);
  for (let j = 0; j < width; j++) {
    str += "|" + pad(str2[j] ?? " ", innerCellWidth, " ");
  }
  str += "\n";
  str += "—".repeat(innerCellWidth) + ("+" + "–".repeat(innerCellWidth)).repeat(width) + "\n";
  for (let i = 0; i < height; i++) {
    str += pad(str1[i] ?? " ", innerCellWidth, " ");
    for (let j = 0; j < width; j++) {
      str += "|" + pad((mat[i]?.[j] ?? " ").toString(), innerCellWidth, " ");
    }
    str += "\n";
    str += "—".repeat(innerCellWidth) + ("+" + "–".repeat(innerCellWidth)).repeat(width) + "\n";
  }
  return str.substring(0, str.length - 1);
}
