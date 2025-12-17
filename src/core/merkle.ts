export function demoHash(input: string): string {
    let h = 0xdeadbeef;
    for (let i = 0; i < input.length; i++) {
        h = Math.imul(h ^ input.charCodeAt(i), 2654435761);
    }
    return ((h ^ (h >>> 16)) >>> 0).toString(16).padStart(8, "0").slice(0, 6);
}

export function buildMerkleLevels(leafHashes: string[]): string[][] {
    if (leafHashes.length === 0) return [];

    const levels: string[][] = [leafHashes];
    let current = leafHashes;

    while (current.length > 1) {
        const next: string[] = [];
        for (let i = 0; i < current.length; i += 2) {
            const left = current[i];
            const right = i + 1 < current.length ? current[i + 1] : left;
            next.push(demoHash(left + right));
        }
        levels.push(next);
        current = next;
    }

    return levels;
}

export function merkleRoot(leafHashes: string[]): string {
    const levels = buildMerkleLevels(leafHashes);
    if (levels.length === 0) return "";
    return levels[levels.length - 1][0] ?? "";
}
