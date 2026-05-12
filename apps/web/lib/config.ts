export function getCreditPacks() {
  return [
    {
      id: 'pack_100',
      size: parseInt(process.env.PACK_100_SIZE ?? '100', 10),
      priceEur: parseInt(process.env.PACK_100_PRICE_EUR ?? '19', 10),
      label: 'Starter',
      description: 'Enough for your first meaningful PRD',
    },
    {
      id: 'pack_200',
      size: parseInt(process.env.PACK_200_SIZE ?? '200', 10),
      priceEur: parseInt(process.env.PACK_200_PRICE_EUR ?? '29', 10),
      label: 'Builder',
      description: 'Deeper iteration and refinement',
    },
    {
      id: 'pack_1000',
      size: parseInt(process.env.PACK_1000_SIZE ?? '1000', 10),
      priceEur: parseInt(process.env.PACK_1000_PRICE_EUR ?? '99', 10),
      label: 'Power',
      description: 'Multi-project, unlimited iteration',
    },
  ]
}

export function getCreditCosts() {
  return {
    clarification: parseInt(process.env.CREDIT_COST_CLARIFICATION ?? '1', 10),
    decision: parseInt(process.env.CREDIT_COST_DECISION ?? '3', 10),
    mini_form: parseInt(process.env.CREDIT_COST_MINI_FORM ?? '5', 10),
    prd_generation: parseInt(process.env.CREDIT_COST_PRD_GENERATION ?? '10', 10),
    prd_challenge: parseInt(process.env.CREDIT_COST_PRD_CHALLENGE ?? '15', 10),
    story_generation: parseInt(process.env.CREDIT_COST_STORY_GENERATION ?? '10', 10),
  }
}
