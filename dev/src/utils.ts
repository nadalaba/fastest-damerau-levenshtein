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
    sections[i] = colorSymbol + sections[i] + resetSymbol;
  }

  return sections.join("");
}

export function countOccurrences(str: string, sub: string): number {
  let count = 0,
    pos = 0;
  while ((pos = str.indexOf(sub, pos)) !== -1) {
    count++;
    pos += sub.length;
  }
  return count;
}

// range takes priority over max if both are defined
export function getRandomIntegerInRangeInclusive({
  min,
  max,
  possibleIntsCount,
  rnd,
}: {
  min?: number;
  max?: number;
  possibleIntsCount?: number;
  rnd?: () => number;
}): number {
  rnd ??= splitmix32(Date.now());
  if (min !== undefined && max !== undefined && max < min) {
    [max, min] = [min, max];
  }
  min = Math.ceil(min ?? 0);
  if (possibleIntsCount === undefined || possibleIntsCount < 1) {
    if (max === undefined) possibleIntsCount = 1;
    else possibleIntsCount = max - min + 1;
  }
  return Math.floor(rnd() * Math.floor(possibleIntsCount)) + min;
}

export type CharsetCluster = {
  min?: number;
  max?: number;
  weight?: number;
  sequence?: string[];
};

export function getRandomString(
  size: number,
  charsetClusters: CharsetCluster[] = [{ min: 0x20, max: 0x7e }],
  rnd?: () => number,
): string {
  rnd ??= splitmix32(Date.now());
  const weightedClustersLen = charsetClusters.reduce((acc, curr) => acc + (curr.weight ?? 1), 0);
  const getRandomCluster = () => {
    const randomI = weightedClustersLen * rnd();
    let cluster: CharsetCluster = charsetClusters[0],
      cumulativeWeight = 0;
    for (cluster of charsetClusters) {
      cumulativeWeight += cluster.weight ?? 1;
      if (randomI < cumulativeWeight) break;
    }
    return cluster;
  };
  let attemptsForLastChar = 0,
    str = "";
  while ([...str].length < size) {
    const cluster = getRandomCluster();
    if (cluster.sequence?.length) {
      cluster.min = 0;
      cluster.max = cluster.sequence.length - 1;
    } else if (cluster.min === undefined && cluster.max === undefined) {
      throw Error("Each cluster should have a min, a max, or a sequence.");
    }
    const r = getRandomIntegerInRangeInclusive({
      min: cluster.min,
      max: cluster.max,
      rnd,
    });
    const symbol = cluster.sequence ? cluster.sequence[r] : String.fromCodePoint(r);
    if ([...symbol].length > size - [...str].length) {
      if (attemptsForLastChar > 10) break;
      attemptsForLastChar++;
      size--;
      continue;
    }
    str += symbol;
  }
  return str;
}

export function splitmix32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}
