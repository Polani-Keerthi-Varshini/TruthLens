import streamlit as st
import pandas as pd

class Dashboard:
    def __init__(self):
        self.risk_colors = {
            'low': 'green',
            'medium': 'yellow',
            'high': 'red'
        }

    def display_claims(self, claims: list, fact_checks: dict, credibility_scores: dict):
        """Display claims and their analysis results."""
        st.subheader("Identified Claims and Analysis")

        for i, claim in enumerate(claims):
            with st.container():
                col1, col2 = st.columns([2, 1])
                
                with col1:
                    st.markdown(f"**Claim {i+1}:** {claim['text']}")
                    
                    # Display entities
                    if claim['entities']:
                        st.markdown("**Identified Entities:**")
                        for entity, entity_type in claim['entities']:
                            st.markdown(f"- {entity} ({entity_type})")

                with col2:
                    if credibility_scores.get(i):
                        score = credibility_scores[i]
                        risk_level = score['risk_level']
                        st.markdown(f"**Credibility Score:** {score['score']:.2f}")
                        st.markdown(f"**Risk Level:** "
                                  f":{self.risk_colors[risk_level]}[{risk_level.upper()}]")

                # Display fact-check results
                if fact_checks.get(i):
                    self._display_fact_check_results(fact_checks[i])

                st.markdown("---")

    def _display_fact_check_results(self, fact_check: dict):
        """Display fact-checking results."""
        st.markdown("**Fact Check Results:**")
        
        if fact_check['status'] == 'error':
            st.error(f"Error during fact-checking: {fact_check.get('error', 'Unknown error')}")
            return

        if fact_check['verified']:
            st.markdown("✅ Claim has been fact-checked")
            if fact_check['sources']:
                st.markdown("**Sources:**")
                for source in fact_check['sources']:
                    st.markdown(f"- {source}")
        else:
            st.warning("⚠️ No direct fact-checks found for this claim")
