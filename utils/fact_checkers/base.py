from abc import ABC, abstractmethod
from typing import Dict, List, Optional

class BaseFactChecker(ABC):
    """Base class for fact checking API integrations."""
    
    @abstractmethod
    def verify_claim(self, claim_text: str) -> Dict:
        """
        Verify a claim using the fact checking API.
        
        Args:
            claim_text: The text of the claim to verify
            
        Returns:
            Dict containing:
                - verified (bool): Whether the claim was verified
                - matching_facts (List): List of matching fact checks
                - sources (List): List of fact checking sources
                - confidence (float): Confidence score of the verification
                - status (str): Status of the verification
                - error (str, optional): Error message if verification failed
        """
        pass
    
    @abstractmethod
    def get_source_info(self) -> Dict:
        """Get information about the fact checking source."""
        pass

class FactCheckResult:
    """Standardized fact check result object."""
    
    def __init__(self, 
                 verified: bool = False,
                 matching_facts: Optional[List] = None,
                 sources: Optional[List] = None,
                 confidence: float = 0.0,
                 status: str = "unknown",
                 error: Optional[str] = None):
        self.verified = verified
        self.matching_facts = matching_facts or []
        self.sources = sources or []
        self.confidence = confidence
        self.status = status
        self.error = error
    
    def to_dict(self) -> Dict:
        """Convert result to dictionary format."""
        return {
            "verified": self.verified,
            "matching_facts": self.matching_facts,
            "sources": self.sources,
            "confidence": self.confidence,
            "status": self.status,
            "error": self.error
        }
