import nltk
from typing import List, Dict

class ClaimProcessor:
    def __init__(self):
        """Initialize the Claim Processor."""
        self.claim_indicators = [
            'according to', 'reported', 'estimates', 'shows', 'found', 'suggests',
            'stated', 'announced', 'revealed', 'confirmed', 'indicates', 'claims',
            'discovered', 'proves', 'demonstrates', 'recently', 'new study',
            'research shows', 'scientists', 'experts say', 'evidence'
        ]

    def extract_claims(self, text: str) -> List[Dict]:
        """Extract claims from input text using simple pattern matching."""
        claims = []

        try:
            # Split into sentences using simple punctuation
            sentences = [s.strip() for s in text.split('.') if s.strip()]

            for sentence in sentences:
                # Skip very short sentences
                if len(sentence.split()) < 3:
                    continue

                # Check for claim indicators
                has_claim = any(indicator in sentence.lower() for indicator in self.claim_indicators)

                # Check for numbers
                has_numbers = any(c.isdigit() for c in sentence)

                # Simple entity detection (capitalized words)
                entities = []
                words = sentence.split()
                for word in words:
                    if word and word[0].isupper() and len(word) > 1:
                        entities.append((word, 'ENTITY'))
                    if any(c.isdigit() for c in word):
                        entities.append((word, 'NUMBER'))

                # Consider as claim if:
                # 1. Has claim indicators, or
                # 2. Contains entities and looks like a statement, or
                # 3. Contains both entities and numbers
                is_statement = len(sentence.split()) >= 4 and entities
                if has_claim or is_statement or (len(entities) > 0 and has_numbers):
                    claims.append({
                        'text': sentence + '.' if not sentence.endswith('.') else sentence,
                        'entities': entities,
                        'confidence': self._calculate_confidence(sentence, entities, has_claim)
                    })

            return claims

        except Exception as e:
            print(f"Error processing text: {str(e)}")
            return []

    def _calculate_confidence(self, sentence: str, entities: List, has_claim: bool) -> float:
        """Calculate confidence score for a claim."""
        confidence = 0.5  # Base confidence

        # Adjust based on entities
        if len(entities) > 2:
            confidence += 0.2
        elif len(entities) > 0:
            confidence += 0.1

        # Adjust based on claim indicators
        if has_claim:
            confidence += 0.2

        # Adjust based on sentence length and structure
        words = sentence.split()
        if len(words) > 5:  # Longer sentences more likely to be claims
            confidence += 0.1

        # Boost confidence for sentences with clear subject-verb structure
        if entities and len(words) >= 3:
            confidence += 0.1

        return min(confidence, 1.0)

    def get_key_entities(self, text: str) -> Dict:
        """Extract key entities from text."""
        try:
            entities = {}
            words = text.split()

            for word in words:
                if word and word[0].isupper() and len(word) > 1:
                    if 'ENTITY' not in entities:
                        entities['ENTITY'] = []
                    entities['ENTITY'].append(word)
                elif any(c.isdigit() for c in word):
                    if 'NUMBER' not in entities:
                        entities['NUMBER'] = []
                    entities['NUMBER'].append(word)

            return entities
        except Exception as e:
            print(f"Error extracting entities: {str(e)}")
            return {}