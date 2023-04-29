export const combats = {
    none: undefined,
    tutorial: {},
};

export function startCombat(_combatName: keyof typeof combats) {}

export function endCombat() {}
