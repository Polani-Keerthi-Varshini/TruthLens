import streamlit as st
import plotly.graph_objects as go
from typing import List, Dict
import pandas as pd

class GeoVisualizer:
    def __init__(self):
        """Initialize the geographical visualizer."""
        self.color_scale = [
            [0, 'rgb(255, 245, 240)'],    # Light red for low risk
            [0.4, 'rgb(252, 164, 135)'],  # Medium red
            [0.7, 'rgb(251, 106, 74)'],   # Darker red
            [1, 'rgb(203, 24, 29)']       # Deep red for high risk
        ]

    def create_world_map(self, hotspots: List[Dict]) -> go.Figure:
        """Create a world map visualization of misinformation hotspots."""
        # Convert country names to ISO codes for better map display
        country_codes = {
            'United States': 'USA',
            'United Kingdom': 'GBR',
            'Canada': 'CAN',
            'Australia': 'AUS',
            'India': 'IND',
            'Unknown': 'USA'  # Default to USA for demo
        }

        locations = [country_codes.get(h['country'], h['country']) for h in hotspots]
        values = [h['false_claims'] for h in hotspots]
        hover_text = [
            f"Country: {h['country']}<br>" +
            f"Total Claims: {h['total_claims']}<br>" +
            f"False Claims: {h['false_claims']}<br>" +
            f"Risk Level: {h['risk_level'].upper()}"
            for h in hotspots
        ]

        fig = go.Figure(data=go.Choropleth(
            locations=locations,
            z=values,
            text=hover_text,
            colorscale=self.color_scale,
            locationmode='ISO-3',
            colorbar_title="False Claims",
            hoveringmode='closest',
            showscale=True
        ))

        fig.update_layout(
            title_text='Global Misinformation Hotspots',
            geo=dict(
                showframe=False,
                showcoastlines=True,
                projection_type='equirectangular',
                showland=True,
                landcolor='rgb(243, 243, 243)',
                showocean=True,
                oceancolor='rgb(204, 229, 255)',
                showcountries=True,
                countrycolor='rgb(204, 204, 204)'
            ),
            width=800,
            height=500,
            margin={"r":0,"t":30,"l":0,"b":0}
        )

        return fig

    def display_country_stats(self, country_data: Dict):
        """Display detailed statistics for a country."""
        if not country_data:
            st.warning("No data available for selected country")
            return

        stats = country_data['statistics']
        
        # Display main statistics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Claims", stats['total_claims'])
        with col2:
            st.metric("False Claims", stats['false_claims'])
        with col3:
            truth_percentage = round(stats['truth_ratio'] * 100, 1)
            st.metric("Truth Ratio", f"{truth_percentage}%")

        # Display trending topics
        st.subheader("Trending Topics")
        topics_df = pd.DataFrame(
            list(country_data['trending_topics'].items()),
            columns=['Topic', 'Mentions']
        ).sort_values('Mentions', ascending=False)
        
        if not topics_df.empty:
            st.bar_chart(topics_df.set_index('Topic'))

        # Display source distribution
        st.subheader("Source Distribution")
        sources_df = pd.DataFrame(
            list(country_data['sources'].items()),
            columns=['Source', 'Usage']
        ).sort_values('Usage', ascending=False)
        
        if not sources_df.empty:
            st.bar_chart(sources_df.set_index('Source'))