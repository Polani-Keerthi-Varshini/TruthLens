// Function to format dates for charts
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

// Function to create the claims timeline chart
function createClaimsTimeline(data) {
    const dates = data.map(item => item.date);
    const trueClaims = data.map(item => item.true_claims);
    const falseClaims = data.map(item => item.false_claims);

    const trace1 = {
        x: dates,
        y: trueClaims,
        name: 'True Claims',
        type: 'scatter',
        line: {
            color: '#28a745'
        }
    };

    const trace2 = {
        x: dates,
        y: falseClaims,
        name: 'False Claims',
        type: 'scatter',
        line: {
            color: '#dc3545'
        }
    };

    const layout = {
        showlegend: true,
        height: 300,
        margin: { t: 20, l: 40, r: 20, b: 40 },
        xaxis: {
            showgrid: false
        },
        yaxis: {
            showgrid: true,
            gridcolor: '#f0f2f6'
        },
        legend: {
            orientation: 'h',
            y: -0.2
        }
    };

    Plotly.newPlot('claims-timeline', [trace1, trace2], layout);
}

// Function to create the topics chart
function createTopicsChart(data) {
    const values = Object.values(data);
    const labels = Object.keys(data);

    const trace = {
        values: values,
        labels: labels,
        type: 'pie',
        hole: 0.4,
        marker: {
            colors: [
                '#1f77b4',
                '#ff7f0e',
                '#2ca02c',
                '#d62728',
                '#9467bd'
            ]
        }
    };

    const layout = {
        showlegend: true,
        height: 300,
        margin: { t: 20, l: 20, r: 20, b: 20 },
        legend: {
            orientation: 'h',
            y: -0.2
        }
    };

    Plotly.newPlot('topics-chart', [trace], layout);
}

// Function to fetch and update dashboard data
async function updateDashboard() {
    try {
        const response = await fetch('/dashboard/data');
        const data = await response.json();

        if (data.success) {
            createClaimsTimeline(data.timeline_data);
            createTopicsChart(data.topics_data);
        }
    } catch (error) {
        console.error('Failed to update dashboard:', error);
    }
}

// Initialize dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();

    // Update dashboard periodically
    setInterval(updateDashboard, 60000); // Update every minute
});
