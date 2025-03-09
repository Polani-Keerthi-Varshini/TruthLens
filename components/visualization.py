import streamlit as st
import plotly.graph_objects as go
from typing import Dict

class Visualizer:
    def create_credibility_gauge(self, score: float) -> go.Figure:
        """Create a gauge chart for credibility score."""
        fig = go.Figure(go.Indicator(
            mode = "gauge+number",
            value = score * 100,
            domain = {'x': [0, 1], 'y': [0, 1]},
            title = {'text': "Credibility Score"},
            gauge = {
                'axis': {'range': [0, 100]},
                'bar': {'color': self._get_score_color(score)},
                'steps': [
                    {'range': [0, 40], 'color': "lightcoral"},
                    {'range': [40, 70], 'color': "khaki"},
                    {'range': [70, 100], 'color': "lightgreen"}
                ]
            }
        ))
        
        fig.update_layout(height=200)
        return fig

    def _get_score_color(self, score: float) -> str:
        """Get color based on score value."""
        if score >= 0.7:
            return "green"
        elif score >= 0.4:
            return "yellow"
        return "red"

    def create_entity_chart(self, entities: Dict) -> go.Figure:
        """Create a bar chart of entity frequencies."""
        entity_types = list(entities.keys())
        entity_counts = [len(entities[et]) for et in entity_types]
        
        fig = go.Figure(data=[
            go.Bar(
                x=entity_types,
                y=entity_counts,
                marker_color='lightblue'
            )
        ])
        
        fig.update_layout(
            title="Entity Distribution",
            xaxis_title="Entity Type",
            yaxis_title="Count",
            height=300
        )
        
        return fig
