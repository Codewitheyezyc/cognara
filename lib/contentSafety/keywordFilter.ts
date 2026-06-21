const BLOCKED_KEYWORDS = [
  // Weapons and violence
  'bomb', 'explosive', 'kill', 'murder', 'weapon', 'gun making',
  'poison', 'hurt someone', 'harm people', 'attack',

  // Illegal activities
  'hack into', 'crack password', 'steal data', 'scam people',
  'fraud', 'phishing', 'money laundering', 'drug making',
  'how to cheat', 'pyramid scheme', 'ponzi',

  // Inappropriate
  'sex', 'porn', 'nude', 'naked', 'adult content',

  // Hate
  'hate', 'racist', 'terrorism', 'extremist', 'cult',
]

const SUSPICIOUS_PATTERNS = [
  /how to (hurt|harm|kill|steal|hack|scam)/i,
  /make (a bomb|weapons|drugs|poison)/i,
  /bypass (security|firewall|password)/i,
  /illegal (money|activity|scheme)/i,
]

export interface FilterResult {
  passed: boolean
  reason?: string
}

export function clientSideFilter(goalText: string): FilterResult {
  const lower = goalText.toLowerCase()

  // Check blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        passed: false,
        reason: `This type of content is not available on Cognara. Cognara is a learning platform focused on education, skills, and personal growth.`
      }
    }
  }

  // Check suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(goalText)) {
      return {
        passed: false,
        reason: `Cognara only accepts educational and skill-building goals. Please describe what you genuinely want to learn.`
      }
    }
  }

  return { passed: true }
}
