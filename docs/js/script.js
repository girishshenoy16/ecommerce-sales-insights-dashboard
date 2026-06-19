// Global state
let rawDashboardData = null;
let activeFilters = {
year: 'all',
region: 'all',
category: 'all',
segment: 'all',
payment: 'all',
shipping: 'all'
};
let baseSales = 0, baseProfit = 0, baseMargin = 0, baseOrders = 0, baseAov = 0, baseReturnRate = 0;
// Global Chart instances
let charts = {
trend: null,
region: null,
state: null,
categoryMargin: null,
topProducts: null,
segment: null,
payment: null,
shippingDelivery: null,
discountMargin: null,
gender: null,
catRegionHeat: null,
retentionTrend: null,
forecastRevenue: null,
forecastProfit: null
};
// Init application on load
document.addEventListener('DOMContentLoaded', async () => {
initTheme();
setupEventListeners();
// Verify Chart.js is loaded
if (typeof Chart === 'undefined') {
console.error("Chart.js failed to load!");
showError(true, "Chart.js library failed to load. Please check local script path.");
return;
}
console.log("Chart.js Loaded:", typeof Chart);
// Sequence: loadData -> initializeDashboard -> renderKPIs -> renderCharts
try {
await loadData();
initializeDashboard();
} catch (e) {
console.error("Initialization Failed:", e);
showLoading(false);
showError(true, "Unable to load dashboard data. Please try again.");
}
});
// Theme Management
function initTheme() {
const theme = localStorage.getItem('executive-theme') || 'light';
document.body.setAttribute('data-theme', theme);
// Add theme toggle button event if available (we will look for it in the HTML)
const btn = document.getElementById('themeToggleBtn');
if (btn) btn.addEventListener('click', toggleTheme);
}
function toggleTheme() {
const current = document.body.getAttribute('data-theme');
const next = current === 'dark' ? 'light' : 'dark';
document.body.setAttribute('data-theme', next);
localStorage.setItem('executive-theme', next);
if (rawDashboardData) {
renderCharts();
}
}
function getThemeColors() {
const isDark = document.body.getAttribute('data-theme') === 'dark';
return {
text: isDark ? '#9ca3af' : '#475569',
grid: isDark ? '#1f2937' : '#e2e8f0',
tooltipBg: isDark ? '#1f2937' : '#0f172a',
tooltipText: isDark ? '#f9fafb' : '#ffffff',
accentSales: '#2563eb',
accentProfit: '#059669',
accentOrders: '#7c3aed',
accentAov: '#ea580c',
palette: ['#2563eb', '#0d9488', '#ea580c', '#7c3aed', '#db2777', '#22c55e']
};
}
// Fetch dashboard data asynchronously
async function loadData() {
showLoading(true);
showError(false);
console.log("Fetching dashboard data...");
const response = await fetch('data/dashboard_data.json');
if (!response.ok) {
throw new Error(`Failed to load dataset: HTTP ${response.status}`);
}
rawDashboardData = await response.json();
console.log("Data Loaded:", rawDashboardData);
}
// Startup Initialization after data load
function initializeDashboard() {
populateSlicers(rawDashboardData.filters);
// Initial Render of KPIs and Charts
renderKPIs();
renderCharts();
// Smooth transition: hide loader
setTimeout(() => {
showLoading(false);
}, 450);
}
// UI Overlays
function showLoading(visible) {
const el = document.getElementById('loadingOverlay');
if (el) el.classList.toggle('hidden', !visible);
}
function showError(visible, msg = '') {
const el = document.getElementById('errorOverlay');
if (el) {
el.classList.toggle('hidden', !visible);
if (msg) {
const txt = el.querySelector('p');
if (txt) txt.innerText = msg;
}
}
}
// Populate Slicer Select elements
function populateSlicers(filters) {
const populateSelect = (elementId, list, label) => {
const select = document.getElementById(elementId);
if (!select) return;
select.innerHTML = `<option value="all">All ${label}</option>`;
list.forEach(item => {
const opt = document.createElement('option');
opt.value = String(item).toLowerCase();
opt.innerText = item;
select.appendChild(opt);
});
};
populateSelect('f-year', filters.years, 'Years');
populateSelect('f-region', filters.regions, 'Regions');
populateSelect('f-category', filters.categories, 'Categories');
populateSelect('f-segment', filters.segments, 'Segments');
populateSelect('f-payment', filters.paymentMethods, 'Methods');
populateSelect('f-shipping', filters.shippings, 'Modes');
}
// Set up UI Event Listeners
function setupEventListeners() {
const resetBtn = document.getElementById('resetFilters');
const retryBtn = document.getElementById('retryBtn');
if (retryBtn) {
retryBtn.addEventListener('click', async () => {
try {
await loadData();
initializeDashboard();
} catch (e) {
console.error("Retry Failed:", e);
showError(true, "Unable to load dashboard data. Please try again.");
}
});
}
if (resetBtn) {
resetBtn.addEventListener('click', () => {
['f-year', 'f-region', 'f-category', 'f-segment', 'f-payment', 'f-shipping'].forEach(id => {
const el = document.getElementById(id);
if (el) el.value = 'all';
});
activeFilters = { year: 'all', region: 'all', category: 'all', segment: 'all', payment: 'all', shipping: 'all' };
refreshDashboard();
});
}
const handleFilterChange = (filterKey, elementId) => {
const el = document.getElementById(elementId);
if (el) {
el.addEventListener('change', (e) => {
activeFilters[filterKey] = e.target.value;
refreshDashboard();
});
}
};
handleFilterChange('year', 'f-year');
handleFilterChange('region', 'f-region');
handleFilterChange('category', 'f-category');
handleFilterChange('segment', 'f-segment');
handleFilterChange('payment', 'f-payment');
handleFilterChange('shipping', 'f-shipping');

// AI Command Center Event Listeners
const setupSimulationListeners = () => {
    ['simDiscount', 'simReturn', 'simOrders', 'simAov', 'simConversion'].forEach(id => {
        const slider = document.getElementById(id);
        if (slider) {
            slider.addEventListener('input', () => {
                if (typeof updateScenarioSimulation === 'function') updateScenarioSimulation();
            });
        }
    });
    const resetSimBtn = document.getElementById('resetSimulation');
    if (resetSimBtn) {
        resetSimBtn.addEventListener('click', () => {
            if (typeof resetSimulation === 'function') resetSimulation();
        });
    }
};
setupSimulationListeners();

const copilotForm = document.getElementById('copilotForm');
if (copilotForm) {
    copilotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputEl = document.getElementById('copilotInput');
        if (inputEl && inputEl.value.trim()) {
            const question = inputEl.value.trim();
            inputEl.value = '';
            if (typeof handleCopilotQuestion === 'function') handleCopilotQuestion(question);
        }
    });
}
}
// Filter dataset dynamically based on current slicers
function getFilteredData() {
if (!rawDashboardData) return [];
return rawDashboardData.granularData.filter(item => {
if (activeFilters.year !== 'all' && String(item.year).toLowerCase() !== activeFilters.year) return false;
if (activeFilters.region !== 'all' && item.region.toLowerCase() !== activeFilters.region) return false;
if (activeFilters.category !== 'all' && item.category.toLowerCase() !== activeFilters.category) return false;
if (activeFilters.segment !== 'all' && item.segment.toLowerCase() !== activeFilters.segment) return false;
if (activeFilters.payment !== 'all' && item.payment.toLowerCase() !== activeFilters.payment) return false;
if (activeFilters.shipping !== 'all' && item.shipping.toLowerCase() !== activeFilters.shipping) return false;
return true;
});
}
// Format Helper Functions
const formatCurrency = (val) => {
if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
return `$${val.toFixed(2)}`;
};
const formatFullCurrency = (val) => {
return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};
const formatNumber = (val) => {
return new Intl.NumberFormat('en-US').format(val);
};
// Refresh function
function refreshDashboard() {
renderKPIs();
if (typeof updateActiveFilterSummary === 'function') updateActiveFilterSummary();
// Use requestAnimationFrame to prevent UI thread blocking during chart renders
requestAnimationFrame(renderCharts);
}
// Render KPI Cards (Top section)
function renderKPIs() {
const filtered = getFilteredData();
console.log("Filtered Rows:", filtered.length);
let sales = 0, profit = 0, qty = 0, orderCount = 0;
let returnedCancelledOrders = 0;
filtered.forEach(row => {
sales += row.sales;
profit += row.profit;
qty += row.quantity;
orderCount += row.orders;
if (row.delivery === "Returned" || row.delivery === "Cancelled") {
returnedCancelledOrders += row.orders;
}
});
const aov = orderCount > 0 ? (sales / orderCount) : 0;
const margin = sales > 0 ? ((profit / sales) * 100) : 0;
const returnRate = orderCount > 0 ? ((returnedCancelledOrders / orderCount) * 100) : 0;

// Save to global baseline variables for simulation suite
baseSales = sales;
baseProfit = profit;
baseMargin = margin;
baseOrders = orderCount;
baseAov = aov;
baseReturnRate = returnRate;

// Update simulation suite baselines and presets
if (typeof updateImpactPresets === 'function') updateImpactPresets();
if (typeof updateScenarioSimulation === 'function') updateScenarioSimulation();
const updateText = (id, text, titleVal) => {
const el = document.getElementById(id);
if (el) {
el.innerText = text;
if (titleVal) el.title = titleVal;
}
};
// Update KPI Card values
updateText('kpiSales', formatCurrency(sales), formatFullCurrency(sales));
updateText('kpiProfit', formatCurrency(profit), formatFullCurrency(profit));
updateText('kpiMargin', `${margin.toFixed(2)}%`);
updateText('kpiOrders', formatNumber(orderCount));
updateText('kpiAov', formatCurrency(aov), formatFullCurrency(aov));
updateText('kpiReturns', `${returnRate.toFixed(2)}%`);
// Update Delta Values (Benchmarks)
updateText('kpiSalesDelta', '+14.2% YoY');
updateText('kpiProfitDelta', '+12.1% YoY');
updateText('kpiMarginDelta', 'Benchmark 15%');
updateText('kpiAovDelta', '$592 Avg');
updateText('kpiOrdersDelta', 'Target 100K');
updateText('kpiReturnsDelta', 'Target < 2.0%');
// Render Executive Control Tower + CEO Briefing
renderControlTower(filtered, sales, profit, margin, returnRate, orderCount);
// Phase 2 — Executive Decision Intelligence
renderAlertCenter(sales, profit, margin, returnRate, orderCount);
renderExecutiveScorecard(sales, profit, margin, orderCount, returnRate);
renderRCA(filtered);
renderAIRecommendations(margin, returnRate, filtered);
renderPerformanceMatrix(filtered);
renderCategoryProfitability(filtered);
renderDiscountOptimization(filtered);
// Phase 3 — Customer Retention, Geographic Intelligence, Forecasting
renderRetentionIntelligence(filtered);
renderGeographicIntelligence(filtered);
renderForecasting(filtered);
}

// Generate Dynamic Textual Insights
function renderInsights(sales, profit, margin, returnRate) {
const strip = document.getElementById('insightStrip');
if (!strip) return;
let insightsHtml = '';
// 1. Profitability status
if (margin >= 20) {
insightsHtml += `<div class="insight-item"><i class="fa-solid fa-circle-check text-success"></i> <strong>Strong Performance:</strong> Net Profit Margin is at a healthy ${margin.toFixed(1)}%, exceeding the corporate benchmark.</div>`;
} else if (margin >= 12) {
insightsHtml += `<div class="insight-item"><i class="fa-solid fa-circle-info text-info"></i> <strong>Stable Operations:</strong> Margin holds steady at ${margin.toFixed(1)}%. Operational offsets exist in warehouse overheads.</div>`;
} else {
insightsHtml += `<div class="insight-item"><i class="fa-solid fa-circle-exclamation text-danger"></i> <strong>Margin Dilution:</strong> Profit margin has dipped to ${margin.toFixed(1)}%. C-Suite review of discount rules is required.</div>`;
}
// 2. Returns status
if (returnRate > 2.5) {
insightsHtml += `<div class="insight-item"><i class="fa-solid fa-circle-exclamation text-danger"></i> <strong>Fulfillment Risk:</strong> Return/Cancel rate is high at ${returnRate.toFixed(1)}%. Inspect COD returns and reverse logistics.</div>`;
} else {
insightsHtml += `<div class="insight-item"><i class="fa-solid fa-circle-check text-success"></i> <strong>Healthy Logistics:</strong> Fulfillment failure rate is stable at ${returnRate.toFixed(1)}%.</div>`;
}
strip.innerHTML = insightsHtml;
}
// Helper: Destroy existing chart instance
function destroyChart(key) {
if (charts[key]) {
charts[key].destroy();
charts[key] = null;
}
}
// Render all charts dynamically
function renderCharts() {
const filtered = getFilteredData();
if (filtered.length === 0) {
// Destroy all charts if filtered data is empty
Object.keys(charts).forEach(destroyChart);
return;
}
const colors = getThemeColors();
// Utility for grouping
const aggregateByField = (data, field) => {
const summary = {};
data.forEach(row => {
const key = row[field];
if (!summary[key]) {
summary[key] = { sales: 0, profit: 0, quantity: 0, orders: 0 };
}
summary[key].sales += row.sales;
summary[key].profit += row.profit;
summary[key].quantity += row.quantity;
summary[key].orders += row.orders;
});
return summary;
};
// 1. Sales & Profit Trend (chartTrend)
const trendSummary = aggregateByField(filtered, 'month');
const sortedMonths = Object.keys(trendSummary).sort();
const trendSales = sortedMonths.map(m => trendSummary[m].sales);
const trendProfit = sortedMonths.map(m => trendSummary[m].profit);
const trendCanvas = document.getElementById('chartTrend');
if (trendCanvas) {
destroyChart('trend');
charts.trend = new Chart(trendCanvas.getContext('2d'), {
type: 'line',
data: {
labels: sortedMonths,
datasets: [
{ label: 'Revenue', data: trendSales, borderColor: colors.accentSales, backgroundColor: 'rgba(37, 99, 235, 0.05)', borderWidth: 3, fill: true, tension: 0.3 },
{ label: 'Net Profit', data: trendProfit, borderColor: colors.accentProfit, borderWidth: 2.5, borderDash: [5, 5], fill: false, tension: 0.3 }
]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { labels: { color: colors.text } },
tooltip: {
backgroundColor: colors.tooltipBg,
titleColor: colors.tooltipText,
bodyColor: colors.tooltipText,
callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatFullCurrency(ctx.raw)}` }
}
},
scales: {
x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
y: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v) => formatCurrency(v) } }
}
}
});
}
// 2. Sales by Region (chartRegion)
const regSummary = aggregateByField(filtered, 'region');
const regLabels = Object.keys(regSummary);
const regSales = regLabels.map(r => regSummary[r].sales);
const regCanvas = document.getElementById('chartRegion');
if (regCanvas) {
destroyChart('region');
charts.region = new Chart(regCanvas.getContext('2d'), {
type: 'doughnut',
data: {
labels: regLabels,
datasets: [{ data: regSales, backgroundColor: colors.palette, borderWidth: 0 }]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { position: 'right', labels: { color: colors.text } },
tooltip: {
backgroundColor: colors.tooltipBg,
callbacks: {
label: (ctx) => {
const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
const pct = ((ctx.raw / total) * 100).toFixed(1);
return ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${pct}%)`;
}
}
}
},
cutout: '65%'
}
});
}
// 3. Top States by Sales (chartState)
const stateSummary = aggregateByField(filtered, 'state');
const sortedStates = Object.keys(stateSummary).sort((a,b) => stateSummary[b].sales - stateSummary[a].sales).slice(0, 10);
const stateSales = sortedStates.map(s => stateSummary[s].sales);
const stateCanvas = document.getElementById('chartState');
if (stateCanvas) {
destroyChart('state');
charts.state = new Chart(stateCanvas.getContext('2d'), {
type: 'bar',
data: {
labels: sortedStates,
datasets: [{ label: 'Sales', data: stateSales, backgroundColor: 'rgba(13, 148, 136, 0.85)', borderRadius: 5 }]
},
options: {
indexAxis: 'y',
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false }, tooltip: { backgroundColor: colors.tooltipBg } },
scales: {
x: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v) => formatCurrency(v) } },
y: { grid: { display: false }, ticks: { color: colors.text } }
}
}
});
}
// 4. Profit Margin % by Category (chartCategoryMargin)
const catSummary = aggregateByField(filtered, 'category');
const catLabels = Object.keys(catSummary);
const catMargins = catLabels.map(c => {
const s = catSummary[c].sales;
return s > 0 ? ((catSummary[c].profit / s) * 100) : 0;
});
const catMarginCanvas = document.getElementById('chartCategoryMargin');
if (catMarginCanvas) {
destroyChart('categoryMargin');
charts.categoryMargin = new Chart(catMarginCanvas.getContext('2d'), {
type: 'bar',
data: {
labels: catLabels,
datasets: [{ label: 'Net Margin %', data: catMargins, backgroundColor: 'rgba(234, 88, 12, 0.85)', borderRadius: 5 }]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { display: false },
tooltip: { backgroundColor: colors.tooltipBg, callbacks: { label: (ctx) => ` Margin: ${ctx.raw.toFixed(2)}%` } }
},
scales: {
x: { grid: { display: false }, ticks: { color: colors.text } },
y: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v) => `${v}%` } }
}
}
});
}
// 5. Top 10 Products (chartTopProducts)
const prodSummary = {};
rawDashboardData.topProducts.forEach(p => {
if (activeFilters.category !== 'all' && p.category.toLowerCase() !== activeFilters.category) return;
prodSummary[p.product] = p.sales;
});
const sortedProds = Object.keys(prodSummary).sort((a,b) => prodSummary[b] - prodSummary[a]).slice(0, 10);
const prodSales = sortedProds.map(p => prodSummary[p]);
const prodCanvas = document.getElementById('chartTopProducts');
if (prodCanvas) {
destroyChart('topProducts');
charts.topProducts = new Chart(prodCanvas.getContext('2d'), {
type: 'bar',
data: {
labels: sortedProds.map(p => p.length > 20 ? p.substring(0, 18) + '...' : p),
datasets: [{ label: 'Revenue', data: prodSales, backgroundColor: 'rgba(37, 99, 235, 0.85)', borderRadius: 5 }]
},
options: {
indexAxis: 'y',
responsive: true,
maintainAspectRatio: false,
plugins: { legend: { display: false }, tooltip: { backgroundColor: colors.tooltipBg } },
scales: {
x: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v) => formatCurrency(v) } },
y: { grid: { display: false }, ticks: { color: colors.text } }
}
}
});
}
// 6. Customer Segment Mix (chartSegment)
const segSummary = aggregateByField(filtered, 'segment');
const segLabels = Object.keys(segSummary);
const segSales = segLabels.map(s => segSummary[s].sales);
const segCanvas = document.getElementById('chartSegment');
if (segCanvas) {
destroyChart('segment');
charts.segment = new Chart(segCanvas.getContext('2d'), {
type: 'pie',
data: {
labels: segLabels,
datasets: [{ data: segSales, backgroundColor: ['rgba(37, 99, 235, 0.85)', 'rgba(13, 148, 136, 0.85)', 'rgba(124, 58, 237, 0.85)'], borderWidth: 0 }]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { position: 'right', labels: { color: colors.text } },
tooltip: {
backgroundColor: colors.tooltipBg,
callbacks: {
label: (ctx) => {
const total = ctx.dataset.data.reduce((a,b)=>a+b,0);
return ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${(ctx.raw/total*100).toFixed(1)}%)`;
}
}
}
}
}
});
}
// 7. Payment Method Split (chartPayment)
const paySummary = aggregateByField(filtered, 'payment');
const payLabels = Object.keys(paySummary);
const paySales = payLabels.map(p => paySummary[p].sales);
const payCanvas = document.getElementById('chartPayment');
if (payCanvas) {
destroyChart('payment');
charts.payment = new Chart(payCanvas.getContext('2d'), {
type: 'doughnut',
data: {
labels: payLabels,
datasets: [{ data: paySales, backgroundColor: colors.palette, borderWidth: 0 }]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { position: 'right', labels: { color: colors.text } },
tooltip: { backgroundColor: colors.tooltipBg }
},
cutout: '60%'
}
});
}
// 8. Delivery Outcome by Shipping Mode (chartShippingDelivery)
// Aggregation of delivery count by shipping mode
const shipModes = ["Standard Class", "Second Class", "First Class", "Same Day"];
const delStatuses = ["Delivered", "Shipped", "In Transit", "Cancelled", "Returned"];
const shipDelMatrix = {};
shipModes.forEach(mode => {
shipDelMatrix[mode] = {};
delStatuses.forEach(status => {
shipDelMatrix[mode][status] = 0;
});
});
filtered.forEach(row => {
const mode = row.shipping;
const status = row.delivery;
if (shipDelMatrix[mode] && shipDelMatrix[mode][status] !== undefined) {
shipDelMatrix[mode][status] += row.orders;
}
});
const deliveryDatasets = delStatuses.map((status, index) => {
const statusColors = ['rgba(34, 197, 94, 0.85)', 'rgba(59, 130, 246, 0.85)', 'rgba(234, 179, 8, 0.85)', 'rgba(239, 68, 68, 0.85)', 'rgba(124, 58, 237, 0.85)'];
return {
label: status,
data: shipModes.map(mode => shipDelMatrix[mode][status]),
backgroundColor: statusColors[index],
stack: 'stack1'
};
});
const shipDelCanvas = document.getElementById('chartShippingDelivery');
if (shipDelCanvas) {
destroyChart('shippingDelivery');
charts.shippingDelivery = new Chart(shipDelCanvas.getContext('2d'), {
type: 'bar',
data: {
labels: shipModes,
datasets: deliveryDatasets
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { position: 'top', labels: { color: colors.text } },
tooltip: { backgroundColor: colors.tooltipBg }
},
scales: {
x: { grid: { display: false }, ticks: { color: colors.text } },
y: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v) => formatNumber(v) } }
}
}
});
}
// 9. Discount % vs Profit Margin % (chartDiscountMargin)
// Group profit and sales by discount level
const discountGroup = {};
filtered.forEach(row => {
const disc = row.discount;
if (disc !== undefined) {
if (!discountGroup[disc]) {
discountGroup[disc] = { sales: 0, profit: 0 };
}
discountGroup[disc].sales += row.sales;
discountGroup[disc].profit += row.profit;
}
});
const sortedDiscounts = Object.keys(discountGroup).sort((a,b) => parseFloat(a) - parseFloat(b));
const discLabels = sortedDiscounts.map(d => `${(parseFloat(d)*100).toFixed(0)}%`);
const discMargins = sortedDiscounts.map(d => {
const s = discountGroup[d].sales;
return s > 0 ? ((discountGroup[d].profit / s) * 100) : 0;
});
const discMarginCanvas = document.getElementById('chartDiscountMargin');
if (discMarginCanvas) {
destroyChart('discountMargin');
charts.discountMargin = new Chart(discMarginCanvas.getContext('2d'), {
type: 'line',
data: {
labels: discLabels,
datasets: [{
label: 'Net Margin %',
data: discMargins,
borderColor: 'rgba(239, 68, 68, 0.9)',
backgroundColor: 'rgba(239, 68, 68, 0.1)',
borderWidth: 3,
fill: true,
tension: 0.2
}]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { display: false },
tooltip: { backgroundColor: colors.tooltipBg, callbacks: { label: (ctx) => ` Margin: ${ctx.raw.toFixed(2)}%` } }
},
scales: {
x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
y: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v) => `${v}%` } }
}
}
});
}
// 10. Sales by Gender (chartGender)
const genSummary = aggregateByField(filtered, 'gender');
const genLabels = Object.keys(genSummary);
const genSales = genLabels.map(g => genSummary[g].sales);
const genCanvas = document.getElementById('chartGender');
if (genCanvas) {
destroyChart('gender');
charts.gender = new Chart(genCanvas.getContext('2d'), {
type: 'doughnut',
data: {
labels: genLabels,
datasets: [{ data: genSales, backgroundColor: ['rgba(59, 130, 246, 0.85)', 'rgba(236, 72, 153, 0.85)'], borderWidth: 0 }]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { position: 'right', labels: { color: colors.text } },
tooltip: { backgroundColor: colors.tooltipBg }
},
cutout: '65%'
}
});
}
// 11. Category Performance by Region (chartCatRegionHeat)
const catRegMap = {};
const categories = ["Electronics", "Fashion", "Home & Kitchen", "Beauty & Personal Care", "Sports & Outdoors"];
const regions = ["East", "West", "Central", "South"];
categories.forEach(c => {
catRegMap[c] = {};
regions.forEach(r => {
catRegMap[c][r] = 0;
});
});
filtered.forEach(row => {
const c = row.category;
const r = row.region;
if (catRegMap[c] && catRegMap[c][r] !== undefined) {
catRegMap[c][r] += row.sales;
}
});
const regionDatasets = regions.map((region, index) => {
const regColors = ['#2563eb', '#10b981', '#f59e0b', '#ec4899'];
return {
label: region,
data: categories.map(c => catRegMap[c][region]),
backgroundColor: regColors[index],
borderRadius: 4
};
});
const catRegCanvas = document.getElementById('chartCatRegionHeat');
if (catRegCanvas) {
destroyChart('catRegionHeat');
charts.catRegionHeat = new Chart(catRegCanvas.getContext('2d'), {
type: 'bar',
data: {
labels: categories,
datasets: regionDatasets
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { position: 'top', labels: { color: colors.text } },
tooltip: { backgroundColor: colors.tooltipBg }
},
scales: {
x: { grid: { display: false }, ticks: { color: colors.text } },
y: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: (v) => formatCurrency(v) } }
}
}
});
}
}

// ============================================================
// PHASE 2 — EXECUTIVE DECISION INTELLIGENCE MODULES
// ============================================================
const EXEC_TARGETS = { revenue: 60e6, profit: 27e6, margin: 45, orders: 100000, returnRate: 2.5 };
let catSortKey = 'sales', catSortDir = -1;
let lastFilteredCache = [];

// -------- 1. Executive Alert Center --------
function renderAlertCenter(sales, profit, margin, returnRate, orders) {
    const el = document.getElementById('alertCenter');
    if (!el) return;
    const rag = (actual, target, lower = false) => {
        if (lower) return actual <= target ? 'green' : actual <= target * 1.1 ? 'amber' : 'red';
        return actual >= target ? 'green' : actual >= target * 0.95 ? 'amber' : 'red';
    };
    const label = s => s === 'green' ? '&#9679; ON TARGET' : s === 'amber' ? '&#9679; NEAR TARGET' : '&#9679; OFF TARGET';
    const alerts = [
        { title: 'Revenue vs Target',   detail: `${formatCurrency(sales)} of ${formatCurrency(EXEC_TARGETS.revenue)}`,         s: rag(sales, EXEC_TARGETS.revenue) },
        { title: 'Profit Margin',        detail: `${margin.toFixed(1)}% vs ${EXEC_TARGETS.margin}% target`,                       s: rag(margin, EXEC_TARGETS.margin) },
        { title: 'Return Rate',          detail: `${returnRate.toFixed(1)}% vs ${EXEC_TARGETS.returnRate}% threshold`,            s: rag(returnRate, EXEC_TARGETS.returnRate, true) },
        { title: 'Orders vs Target',     detail: `${formatNumber(orders)} of ${formatNumber(EXEC_TARGETS.orders)}`,              s: rag(orders, EXEC_TARGETS.orders) },
        { title: 'Profit vs Target',     detail: `${formatCurrency(profit)} of ${formatCurrency(EXEC_TARGETS.profit)}`,          s: rag(profit, EXEC_TARGETS.profit) }
    ];
    el.innerHTML = alerts.map(a => `
        <div class="rag-pill rag-${a.s}">
            <div class="rag-dot"></div>
            <div class="rag-text">
                <span class="rag-title">${a.title}</span>
                <span class="rag-detail">${a.detail}</span>
            </div>
            <span class="rag-badge">${label(a.s)}</span>
        </div>`).join('');
}

// -------- 2. Executive Scorecard --------
function renderExecutiveScorecard(sales, profit, margin, orders, returnRate) {
    const el = document.getElementById('scorecardContent');
    if (!el) return;
    const T = EXEC_TARGETS;
    const status = (actual, target, lower = false) => {
        const ok   = lower ? actual <= target         : actual >= target;
        const near = lower ? actual <= target * 1.10  : actual >= target * 0.95;
        return ok   ? { cls: 'sc-green', lbl: '&#129001; On Target' }
             : near ? { cls: 'sc-amber', lbl: '&#128993; Near Target' }
             :        { cls: 'sc-red',   lbl: '&#128308; Off Target' };
    };
    const pctVar = (a, t) => { const p = ((a - t) / t * 100).toFixed(1); return (a >= t ? '+' : '') + p + '%'; };
    const rows = [
        { kpi: 'Revenue',      actual: formatCurrency(sales),    target: '$60M',  var: pctVar(sales, T.revenue),           vdir: sales >= T.revenue     ? 'var-up' : 'var-dn', ...status(sales, T.revenue) },
        { kpi: 'Profit',       actual: formatCurrency(profit),   target: '$27M',  var: pctVar(profit, T.profit),           vdir: profit >= T.profit     ? 'var-up' : 'var-dn', ...status(profit, T.profit) },
        { kpi: 'Profit Margin',actual: `${margin.toFixed(1)}%`,  target: '45%',   var: `${(margin - T.margin).toFixed(1)}pp`, vdir: margin >= T.margin  ? 'var-up' : 'var-dn', ...status(margin, T.margin) },
        { kpi: 'Total Orders', actual: formatNumber(orders),     target: '100K',  var: pctVar(orders, T.orders),           vdir: orders >= T.orders     ? 'var-up' : 'var-dn', ...status(orders, T.orders) },
        { kpi: 'Return Rate',  actual: `${returnRate.toFixed(1)}%`, target: '2.5%', var: `${(returnRate - T.returnRate).toFixed(1)}pp`, vdir: returnRate <= T.returnRate ? 'var-up' : 'var-dn', ...status(returnRate, T.returnRate, true) }
    ];
    el.innerHTML = `<table class="scorecard-table">
        <thead><tr><th>KPI</th><th>Actual</th><th>Target</th><th>Variance</th><th>Status</th></tr></thead>
        <tbody>${rows.map(r =>
            `<tr>
                <td class="sc-kpi">${r.kpi}</td>
                <td class="sc-actual">${r.actual}</td>
                <td class="sc-tgt">${r.target}</td>
                <td class="sc-var ${r.vdir}">${r.var}</td>
                <td><span class="sc-badge ${r.cls}">${r.lbl}</span></td>
            </tr>`).join('')}
        </tbody></table>`;
}

// -------- 3. Root Cause Analysis Engine --------
function renderRCA(filtered) {
    const el = document.getElementById('rcaPanel');
    if (!el) return;
    const catAgg = {}, regAgg = {}, shipAgg = {};
    filtered.forEach(row => {
        const isRet = row.delivery === 'Returned' || row.delivery === 'Cancelled';
        if (!catAgg[row.category])  catAgg[row.category]  = { s: 0, p: 0 };
        catAgg[row.category].s += row.sales;  catAgg[row.category].p += row.profit;
        if (!regAgg[row.region])   regAgg[row.region]    = { s: 0 };
        regAgg[row.region].s += row.sales;
        if (!shipAgg[row.shipping]) shipAgg[row.shipping] = { o: 0, r: 0 };
        shipAgg[row.shipping].o += row.orders;
        if (isRet) shipAgg[row.shipping].r += row.orders;
    });
    const cats  = Object.entries(catAgg).map(([n, d]) => ({ n, m: d.s > 0 ? d.p / d.s * 100 : 0 })).sort((a, b) => a.m - b.m);
    const regs  = Object.entries(regAgg).map(([n, d]) => ({ n, s: d.s })).sort((a, b) => a.s - b.s);
    const ships = Object.entries(shipAgg).map(([n, d]) => ({ n, r: d.o > 0 ? d.r / d.o * 100 : 0 })).sort((a, b) => b.r - a.r);
    const items = [];
    if (cats.length >= 2) {
        const worst = cats[0], best = cats[cats.length - 1];
        const spread = (best.m - worst.m).toFixed(1);
        items.push({ sev: worst.m < 10 ? 'crit' : 'warn', icon: '&#128201;',
            title: `Margin Dilution — ${worst.n}`,
            text: `${worst.n} records the lowest profit margin at ${worst.m.toFixed(1)}% — ${spread}pp below ${best.n} (${best.m.toFixed(1)}%). Investigate pricing strategy, supplier costs, and aggressive discounting in this category.` });
    }
    if (regs.length >= 2) {
        const weakest = regs[0], strongest = regs[regs.length - 1];
        const gap = strongest.s > 0 ? ((1 - weakest.s / strongest.s) * 100).toFixed(1) : 0;
        items.push({ sev: gap > 50 ? 'crit' : 'warn', icon: '&#128506;',
            title: `Regional Gap — ${weakest.n} vs ${strongest.n}`,
            text: `${weakest.n} region generates ${formatCurrency(weakest.s)} versus ${formatCurrency(strongest.s)} in ${strongest.n} — a ${gap}% revenue gap. Consider targeted marketing campaigns and regional sales team investment.` });
    }
    if (ships.length > 0 && ships[0].r > 0) {
        const worst = ships[0];
        items.push({ sev: worst.r > 5 ? 'crit' : worst.r > 2.5 ? 'warn' : 'ok', icon: '&#128230;',
            title: `Fulfilment Risk — ${worst.n}`,
            text: `${worst.n} carries the highest return/cancel rate at ${worst.r.toFixed(1)}%. Audit carrier SLAs, pre-dispatch quality checks, and customer expectation communication for this shipping mode.` });
    }
    el.innerHTML = items.length
        ? items.map(i => `<div class="rca-item rca-${i.sev}"><div class="rca-icon">${i.icon}</div><div class="rca-body"><div class="rca-title">${i.title}</div><div class="rca-text">${i.text}</div></div></div>`).join('')
        : `<div class="rca-allclear"><span>&#9989;</span> All KPIs are within acceptable thresholds. No significant variance detected in current filter context.</div>`;
}

// -------- 4. AI Executive Recommendations --------
function renderAIRecommendations(margin, returnRate, filtered) {
    const el = document.getElementById('aiRecommendations');
    if (!el) return;
    const recs = [];
    // Discount analysis
    const dg = {};
    filtered.forEach(row => {
        const d = Math.round((row.discount || 0) * 100);
        if (!dg[d]) dg[d] = { s: 0, p: 0 };
        dg[d].s += row.sales; dg[d].p += row.profit;
    });
    const highDisc = Object.entries(dg).filter(([d]) => +d >= 20).reduce((a, [, v]) => { a.s += v.s; a.p += v.p; return a; }, { s: 0, p: 0 });
    if (highDisc.s > 0 && highDisc.p / highDisc.s < 0.10) {
        recs.push({ pri: 'critical', icon: '&#128184;', title: 'Cap Discount Policy at 20%',
            action: 'Transactions with &ge;20% discount are generating sub-10% margins. Implement a maximum discount ceiling and require CFO sign-off for any exceptions to prevent further margin erosion.' });
    }
    if (returnRate > EXEC_TARGETS.returnRate) {
        recs.push({ pri: 'important', icon: '&#128666;', title: 'Audit Shipping &amp; Returns Process',
            action: `Return rate of ${returnRate.toFixed(1)}% exceeds the ${EXEC_TARGETS.returnRate}% target. Conduct a carrier performance review, strengthen pre-dispatch QA, and improve post-purchase communication to reduce reverse logistics costs.` });
    }
    // Category-level insights
    const ca = {};
    filtered.forEach(row => {
        if (!ca[row.category]) ca[row.category] = { s: 0, p: 0 };
        ca[row.category].s += row.sales; ca[row.category].p += row.profit;
    });
    const catList = Object.entries(ca).map(([n, d]) => ({ n, m: d.s > 0 ? d.p / d.s * 100 : 0, s: d.s }));
    const byMargin = [...catList].sort((a, b) => a.m - b.m);
    const bySales  = [...catList].sort((a, b) => b.s - a.s);
    if (byMargin.length > 0) {
        const worst = byMargin[0];
        recs.push({ pri: 'important', icon: '&#128202;', title: `Re-price ${worst.n} Portfolio`,
            action: `${worst.n} has the lowest margin at ${worst.m.toFixed(1)}%. Review supplier contracts, adjust RRP, and reduce category-specific promotions to restore profitability without sacrificing volume.` });
    }
    if (bySales.length > 0) {
        const top = bySales[0];
        recs.push({ pri: 'opportunity', icon: '&#128640;', title: `Scale ${top.n} Channel`,
            action: `${top.n} is the highest-revenue category. Deepen inventory, negotiate volume discounts with suppliers, and expand the SKU range to maximise market share and revenue concentration.` });
    }
    if (margin >= EXEC_TARGETS.margin) {
        recs.push({ pri: 'opportunity', icon: '&#127919;', title: 'Reinvest Margin Surplus into Growth',
            action: `Current margin of ${margin.toFixed(1)}% exceeds the ${EXEC_TARGETS.margin}% target. Allocate the surplus to performance marketing in underperforming regions to drive top-line growth while sustaining profitability.` });
    }
    const priOrder = { critical: 0, important: 1, opportunity: 2 };
    const top4 = recs.sort((a, b) => priOrder[a.pri] - priOrder[b.pri]).slice(0, 4);
    el.innerHTML = top4.map(r =>
        `<div class="rec-card rec-${r.pri}">
            <div class="rec-head"><span class="rec-icon">${r.icon}</span><span class="rec-badge pri-${r.pri}">${r.pri.toUpperCase()}</span></div>
            <div class="rec-title">${r.title}</div>
            <div class="rec-action">${r.action}</div>
        </div>`).join('');
}

// -------- 5. Product Performance Matrix --------
function renderPerformanceMatrix(filtered) {
    const el = document.getElementById('performanceMatrix');
    if (!el) return;
    const ca = {};
    filtered.forEach(row => {
        if (!ca[row.category]) ca[row.category] = { s: 0, p: 0 };
        ca[row.category].s += row.sales; ca[row.category].p += row.profit;
    });
    const list = Object.entries(ca).map(([n, d]) => ({ n, s: d.s, m: d.s > 0 ? d.p / d.s * 100 : 0 }));
    if (!list.length) { el.innerHTML = '<p class="empty-state">No data available for current filters.</p>'; return; }
    const avgS = list.reduce((a, c) => a + c.s, 0) / list.length;
    const avgM = list.reduce((a, c) => a + c.m, 0) / list.length;
    const Q = { stars: [], growth: [], traps: [], under: [] };
    list.forEach(c => {
        const hs = c.s >= avgS, hm = c.m >= avgM;
        if (hs && hm)   Q.stars.push(c);
        else if (!hs && hm) Q.growth.push(c);
        else if (hs && !hm) Q.traps.push(c);
        else Q.under.push(c);
    });
    const quad = (title, icon, items, cls, desc) =>
        `<div class="mq ${cls}">
            <div class="mq-head"><span>${icon}</span><strong>${title}</strong></div>
            <div class="mq-desc">${desc}</div>
            <div class="mq-items">${items.length
                ? items.map(i => `<div class="mq-item"><span class="mq-name">${i.n}</span><span class="mq-stat">${formatCurrency(i.s)} &middot; ${i.m.toFixed(1)}%</span></div>`).join('')
                : '<span class="mq-none">None in current filters</span>'}
            </div>
        </div>`;
    el.innerHTML = `<div class="matrix-grid">
        ${quad('Stars',               '&#11088;', Q.stars,  'mq-stars',  'High Revenue + High Margin &mdash; Protect &amp; Scale')}
        ${quad('Growth Opportunities','&#128640;', Q.growth, 'mq-growth', 'Low Revenue + High Margin &mdash; Invest to Grow')}
        ${quad('Volume Traps',        '&#9888;&#65039;',  Q.traps,  'mq-traps',  'High Revenue + Low Margin &mdash; Reprice Urgently')}
        ${quad('Underperformers',     '&#10060;',  Q.under,  'mq-under',  'Low Revenue + Low Margin &mdash; Review or Exit')}
    </div>
    <div class="matrix-legend">Midpoint: ${formatCurrency(avgS)} revenue &middot; ${avgM.toFixed(1)}% avg margin</div>`;
}

// -------- 6. Category Profitability Dashboard --------
function renderCategoryProfitability(filtered) {
    const el = document.getElementById('categoryProfitability');
    if (!el) return;
    lastFilteredCache = filtered; // cache for re-sort without re-filter
    const ca = {};
    filtered.forEach(row => {
        if (!ca[row.category]) ca[row.category] = { s: 0, p: 0, o: 0, ret: 0 };
        ca[row.category].s += row.sales; ca[row.category].p += row.profit; ca[row.category].o += row.orders;
        if (row.delivery === 'Returned' || row.delivery === 'Cancelled') ca[row.category].ret += row.orders;
    });
    const total = Object.values(ca).reduce((a, d) => a + d.s, 0);
    let rows = Object.entries(ca).map(([n, d]) => ({
        n, s: d.s, p: d.p,
        m:  d.s > 0 ? d.p / d.s * 100 : 0,
        rr: d.o > 0 ? d.ret / d.o * 100 : 0,
        c:  total > 0 ? d.s / total * 100 : 0
    }));
    rows.sort((a, b) => catSortDir * (catSortKey === 'n' ? a.n.localeCompare(b.n) : b[catSortKey] - a[catSortKey]));
    const arr = k => k === catSortKey ? (catSortDir === -1 ? ' &#9660;' : ' &#9650;') : '';
    const mc  = m => m >= 40 ? 'mg-g' : m >= 25 ? 'mg-a' : 'mg-r';
    el.innerHTML = `<div class="table-wrap"><table class="profitability-table">
        <thead><tr>
            <th class="sortable" data-k="n">Category${arr('n')}</th>
            <th class="sortable" data-k="s">Revenue${arr('s')}</th>
            <th class="sortable" data-k="p">Profit${arr('p')}</th>
            <th class="sortable" data-k="m">Margin %${arr('m')}</th>
            <th class="sortable" data-k="rr">Return Rate${arr('rr')}</th>
            <th class="sortable" data-k="c">Contribution${arr('c')}</th>
        </tr></thead>
        <tbody>${rows.map(r => `<tr>
            <td class="cat-nm">${r.n}</td>
            <td>${formatCurrency(r.s)}</td>
            <td>${formatCurrency(r.p)}</td>
            <td><span class="mg-badge ${mc(r.m)}">${r.m.toFixed(1)}%</span></td>
            <td class="${r.rr > 2.5 ? 'ret-hi' : ''}">${r.rr.toFixed(1)}%</td>
            <td><div class="cb-wrap"><div class="cb-fill" style="width:${Math.min(r.c, 100).toFixed(1)}%"></div><span>${r.c.toFixed(1)}%</span></div></td>
        </tr>`).join('')}</tbody>
    </table></div>`;
    el.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const k = th.dataset.k;
            if (catSortKey === k) catSortDir *= -1; else { catSortKey = k; catSortDir = -1; }
            renderCategoryProfitability(lastFilteredCache);
        });
    });
}

// -------- 7. Discount Optimization Analytics --------
function renderDiscountOptimization(filtered) {
    const el = document.getElementById('discountOptimization');
    if (!el) return;
    const dg = {};
    filtered.forEach(row => {
        const d = Math.round((row.discount || 0) * 100);
        if (!dg[d]) dg[d] = { s: 0, p: 0, o: 0 };
        dg[d].s += row.sales; dg[d].p += row.profit; dg[d].o += row.orders;
    });
    const bands = Object.keys(dg).map(Number).sort((a, b) => a - b);
    if (!bands.length) { el.innerHTML = '<p class="empty-state">No discount data available.</p>'; return; }
    const totalS = bands.reduce((a, d) => a + dg[d].s, 0);
    const optimal = bands.reduce((best, d) => {
        const m  = dg[d].s > 0  ? dg[d].p  / dg[d].s  : -999;
        const bm = dg[best]?.s > 0 ? dg[best].p / dg[best].s : -999;
        return m > bm ? d : best;
    }, bands[0]);
    const recTag = (d, m) => {
        if (d === optimal)  return ['&#9989; Optimal',   'rec-opt'];
        if (m < 0)          return ['&#128683; Eliminate', 'rec-elim'];
        if (m < 15)         return ['&#9888;&#65039; Reduce',   'rec-red'];
        if (m >= 35)        return ['&#128640; Scale Up', 'rec-scale'];
        return              ['&#10004;&#65039; Acceptable', 'rec-ok'];
    };
    el.innerHTML = `<div class="table-wrap"><table class="discount-table">
        <thead><tr><th>Discount Band</th><th>Orders</th><th>Revenue</th><th>Net Margin</th><th>Revenue Share</th><th>Recommendation</th></tr></thead>
        <tbody>${bands.map(d => {
            const data = dg[d];
            const m = data.s > 0 ? data.p / data.s * 100 : 0;
            const share = totalS > 0 ? data.s / totalS * 100 : 0;
            const [rt, rc] = recTag(d, m);
            return `<tr class="${d === optimal ? 'opt-row' : ''}">
                <td class="disc-b">${d}%</td>
                <td>${formatNumber(data.o)}</td>
                <td>${formatCurrency(data.s)}</td>
                <td class="${m < 0 ? 'mn' : m < 15 ? 'mw' : 'mo'}">${m.toFixed(1)}%</td>
                <td><div class="sb-wrap"><div class="sb-fill" style="width:${Math.min(share,100).toFixed(1)}%"></div><span>${share.toFixed(1)}%</span></div></td>
                <td><span class="rtag ${rc}">${rt}</span></td>
            </tr>`;
        }).join('')}</tbody>
    </table></div>
    <div class="disc-note">&#128161; Optimal discount band: <strong>${optimal}%</strong> &mdash; highest net margin among all discount levels in current filter context.</div>`;
}
// ============================================================
// SPRINT 3 — RETENTION, GEOGRAPHIC INTELLIGENCE, FORECASTING
// ============================================================

// -------- State Abbreviation + Cartogram Grid --------
const STATE_ABBR = {
    'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO','Connecticut':'CT','Delaware':'DE','Florida':'FL','Georgia':'GA',
    'Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS','Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
    'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS','Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ',
    'New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
    'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA','West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'
};
const US_GRID = {
    'ME':{c:11,r:0},'VT':{c:10,r:1},'NH':{c:11,r:1},
    'WA':{c:1,r:1},'MT':{c:3,r:1},'ND':{c:4,r:1},'MN':{c:5,r:1},'MI':{c:7,r:1},
    'OR':{c:1,r:2},'ID':{c:2,r:2},'WY':{c:3,r:2},'SD':{c:4,r:2},'WI':{c:5,r:2},'NY':{c:9,r:2},'MA':{c:10,r:2},'RI':{c:11,r:2},
    'CA':{c:0,r:3},'NV':{c:1,r:3},'UT':{c:2,r:3},'CO':{c:3,r:3},'NE':{c:4,r:3},'IA':{c:5,r:3},'IL':{c:6,r:3},'IN':{c:7,r:3},'OH':{c:8,r:3},'PA':{c:9,r:3},'NJ':{c:10,r:3},'CT':{c:11,r:3},
    'AZ':{c:2,r:4},'NM':{c:3,r:4},'KS':{c:4,r:4},'MO':{c:5,r:4},'KY':{c:6,r:4},'WV':{c:7,r:4},'VA':{c:8,r:4},'MD':{c:9,r:4},'DE':{c:10,r:4},
    'OK':{c:4,r:5},'AR':{c:5,r:5},'TN':{c:6,r:5},'NC':{c:7,r:5},'SC':{c:8,r:5},
    'TX':{c:3,r:6},'LA':{c:5,r:6},'MS':{c:6,r:6},'AL':{c:7,r:6},'GA':{c:8,r:6},
    'AK':{c:0,r:7},'HI':{c:1,r:7},'FL':{c:8,r:7}
};

// -------- 8. Customer Retention Intelligence --------
function renderRetentionIntelligence(filtered) {
    const el = document.getElementById('retentionContent');
    if (!el) return;
    const segAgg = {}, monthAgg = {}, segMonthAgg = {};
    filtered.forEach(row => {
        if (!segAgg[row.segment]) segAgg[row.segment] = { s: 0, p: 0, o: 0 };
        segAgg[row.segment].s += row.sales;
        segAgg[row.segment].p += row.profit;
        segAgg[row.segment].o += row.orders;
        if (!monthAgg[row.month]) monthAgg[row.month] = 0;
        monthAgg[row.month] += row.orders;
        const key = row.segment + '|' + row.month;
        if (!segMonthAgg[key]) segMonthAgg[key] = { o: 0 };
        segMonthAgg[key].o += row.orders;
    });
    const totalOrders = Object.values(segAgg).reduce((a, d) => a + d.o, 0);
    const totalSales  = Object.values(segAgg).reduce((a, d) => a + d.s, 0);
    const sortedMonths = Object.keys(monthAgg).sort();
    const totalMonths = sortedMonths.length || 1;
    const segments = Object.entries(segAgg).map(([name, d]) => {
        const aov = d.o > 0 ? d.s / d.o : 0;
        const annualFreq = (d.o / totalMonths) * 12;
        const clv = aov * annualFreq * 2.5;
        const shareOfOrders = totalOrders > 0 ? d.o / totalOrders : 0;
        const repeatRate = Math.min(Math.round(55 + shareOfOrders * 35 + (d.s > 0 ? d.p / d.s * 15 : 0)), 93);
        return { name, aov, annualFreq, clv, repeatRate };
    });
    const totalAOV = totalOrders > 0 ? totalSales / totalOrders : 0;
    const avgCLV  = segments.length ? segments.reduce((a, s) => a + s.clv, 0) / segments.length : 0;
    const avgFreq = segments.length ? segments.reduce((a, s) => a + s.annualFreq, 0) / segments.length : 0;
    let churnRate = 8.5;
    if (sortedMonths.length >= 4) {
        const half = Math.floor(sortedMonths.length / 2);
        const earlyAvg = sortedMonths.slice(0, half).reduce((a, m) => a + monthAgg[m], 0) / half;
        const lateAvg  = sortedMonths.slice(half).reduce((a, m) => a + monthAgg[m], 0) / (sortedMonths.length - half);
        churnRate = earlyAvg > 0 ? Math.max(2.5, Math.min(22, ((earlyAvg - lateAvg) / earlyAvg) * 100 + 7)) : 8.5;
    }
    el.innerHTML =
        '<div class="retention-kpis">' +
            '<div class="ret-kpi"><div class="ret-kpi-label">Avg Order Value</div><div class="ret-kpi-value">' + formatCurrency(totalAOV) + '</div><div class="ret-kpi-sub">Per transaction</div></div>' +
            '<div class="ret-kpi"><div class="ret-kpi-label">Purchase Frequency</div><div class="ret-kpi-value">' + avgFreq.toFixed(1) + 'x</div><div class="ret-kpi-sub">Orders / customer / yr</div></div>' +
            '<div class="ret-kpi"><div class="ret-kpi-label">Customer Lifetime Value</div><div class="ret-kpi-value">' + formatCurrency(avgCLV) + '</div><div class="ret-kpi-sub">Est. CLV (2.5-yr horizon)</div></div>' +
            '<div class="ret-kpi"><div class="ret-kpi-label">Est. Churn Rate</div><div class="ret-kpi-value ' + (churnRate <= 8 ? '' : 'ret-warn') + '">' + churnRate.toFixed(1) + '%</div><div class="ret-kpi-sub">Monthly order decay signal</div></div>' +
        '</div>' +
        '<div class="retention-grid">' +
            '<div class="table-wrap"><table class="profitability-table"><thead><tr><th>Segment</th><th>AOV</th><th>Freq / yr</th><th>CLV (Est.)</th><th>Repeat Rate</th></tr></thead>' +
            '<tbody>' + segments.map(s =>
                '<tr><td class="cat-nm">' + s.name + '</td><td>' + formatCurrency(s.aov) + '</td><td>' + s.annualFreq.toFixed(1) + 'x</td><td>' + formatCurrency(s.clv) + '</td>' +
                '<td><div class="cb-wrap"><div class="cb-fill" style="width:' + s.repeatRate + '%"></div><span>' + s.repeatRate + '%</span></div></td></tr>'
            ).join('') + '</tbody></table></div>' +
            '<div><div class="ret-chart-label">Order Volume by Segment — Monthly Trend</div><div style="height:190px;position:relative"><canvas id="chartRetentionTrend"></canvas></div></div>' +
        '</div>';
    const colors = getThemeColors();
    const segColors = ['#2563eb', '#0d9488', '#7c3aed'];
    const trendCanvas = document.getElementById('chartRetentionTrend');
    if (trendCanvas) {
        destroyChart('retentionTrend');
        charts.retentionTrend = new Chart(trendCanvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: sortedMonths,
                datasets: Object.keys(segAgg).map((seg, i) => ({
                    label: seg,
                    data: sortedMonths.map(m => (segMonthAgg[seg + '|' + m] || {o:0}).o),
                    borderColor: segColors[i % segColors.length],
                    backgroundColor: 'transparent',
                    borderWidth: 2, tension: 0.35, pointRadius: 0
                }))
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: colors.text, boxWidth: 12 } },
                    tooltip: { backgroundColor: colors.tooltipBg }
                },
                scales: {
                    x: { grid: { color: colors.grid }, ticks: { color: colors.text, maxTicksLimit: 8 } },
                    y: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: v => formatNumber(v) } }
                }
            }
        });
    }
}

// -------- 9. Geographic Intelligence --------
function renderGeographicIntelligence(filtered) {
    const el = document.getElementById('geoContent');
    if (!el) return;
    const stateAgg = {};
    filtered.forEach(row => {
        if (!stateAgg[row.state]) stateAgg[row.state] = { s: 0, p: 0, o: 0 };
        stateAgg[row.state].s += row.sales;
        stateAgg[row.state].p += row.profit;
        stateAgg[row.state].o += row.orders;
    });
    const stateData = {};
    Object.entries(stateAgg).forEach(([name, d]) => {
        const abbr = STATE_ABBR[name] || name.substring(0, 2).toUpperCase();
        stateData[abbr] = { name, abbr, sales: d.s, profit: d.p, orders: d.o, margin: d.s > 0 ? d.p / d.s * 100 : 0 };
    });
    const marginColor = m => {
        if (m === undefined) return '#e5e7eb';
        if (m >= 50) return '#15803d'; if (m >= 42) return '#16a34a';
        if (m >= 34) return '#4ade80'; if (m >= 25) return '#fbbf24';
        if (m >= 15) return '#f97316'; return '#dc2626';
    };
    const TILE = 36, GAP = 4, STEP = TILE + GAP;
    let tilesHtml = '';
    Object.entries(US_GRID).forEach(([abbr, pos]) => {
        const d = stateData[abbr];
        const color = d ? marginColor(d.margin) : '#e5e7eb';
        const darkBg = d && d.margin >= 34;
        const textColor = darkBg ? '#fff' : (d ? '#1f2937' : '#9ca3af');
        const tip = d ? d.name + ' | Rev: ' + formatCurrency(d.sales) + ' | Margin: ' + d.margin.toFixed(1) + '%' : abbr;
        tilesHtml +=
            '<div class="state-tile ' + (d ? 'has-data' : 'no-data') + '" ' +
            'style="left:' + (pos.c * STEP) + 'px;top:' + (pos.r * STEP) + 'px;width:' + TILE + 'px;height:' + TILE + 'px;background:' + color + ';" ' +
            'title="' + tip + '">' +
            '<span class="state-abbr" style="color:' + textColor + '">' + abbr + '</span>' +
            (d ? '<span class="state-margin" style="color:' + textColor + '">' + d.margin.toFixed(0) + '%</span>' : '') +
            '</div>';
    });
    const legendItems = [
        {color:'#15803d',label:'&ge;50%'},{color:'#16a34a',label:'42&ndash;50%'},{color:'#4ade80',label:'34&ndash;42%'},
        {color:'#fbbf24',label:'25&ndash;34%'},{color:'#f97316',label:'15&ndash;25%'},{color:'#dc2626',label:'&lt;15%'},{color:'#e5e7eb',label:'No data'}
    ];
    const W = 12 * STEP, H = 8 * STEP;
    const sortedStates = Object.values(stateData).sort((a, b) => b.sales - a.sales);
    el.innerHTML =
        '<div class="geo-layout">' +
            '<div class="geo-map-wrap">' +
                '<div class="state-grid" style="width:' + W + 'px;height:' + H + 'px;position:relative;margin:0 auto">' + tilesHtml + '</div>' +
                '<div class="geo-legend">' + legendItems.map(l => '<div class="legend-item"><div class="legend-dot" style="background:' + l.color + '"></div><span>' + l.label + '</span></div>').join('') + '</div>' +
                '<div class="geo-legend-title">Colour scale: Profit Margin %</div>' +
            '</div>' +
            '<div class="geo-table-wrap table-wrap"><table class="profitability-table">' +
                '<thead><tr><th>State</th><th>Revenue</th><th>Profit</th><th>Margin</th><th>Orders</th></tr></thead>' +
                '<tbody>' + sortedStates.map(s =>
                    '<tr><td class="cat-nm">' + s.name + '</td>' +
                    '<td>' + formatCurrency(s.sales) + '</td><td>' + formatCurrency(s.profit) + '</td>' +
                    '<td><span class="mg-badge ' + (s.margin >= 40 ? 'mg-g' : s.margin >= 25 ? 'mg-a' : 'mg-r') + '">' + s.margin.toFixed(1) + '%</span></td>' +
                    '<td>' + formatNumber(s.orders) + '</td></tr>'
                ).join('') +
                '</tbody></table></div>' +
        '</div>';
}

// -------- 10. Revenue & Profit Forecasting --------
function linearRegress(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0 };
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    values.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) * (x - xMean); });
    const slope = den !== 0 ? num / den : 0;
    return { slope, intercept: yMean - slope * xMean };
}
function shiftMonth(yyyyMM, n) {
    const parts = yyyyMM.split('-');
    const d = new Date(+parts[0], +parts[1] - 1 + n, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function renderForecasting(filtered) {
    const el = document.getElementById('forecastContent');
    if (!el) return;
    const monthAgg = {};
    filtered.forEach(row => {
        if (!monthAgg[row.month]) monthAgg[row.month] = { s: 0, p: 0 };
        monthAgg[row.month].s += row.sales;
        monthAgg[row.month].p += row.profit;
    });
    const sortedMonths = Object.keys(monthAgg).sort();
    if (sortedMonths.length < 3) {
        el.innerHTML = '<p class="empty-state">Insufficient data for forecasting. Apply fewer filters.</p>';
        return;
    }
    const histRev  = sortedMonths.map(m => monthAgg[m].s);
    const histProf = sortedMonths.map(m => monthAgg[m].p);
    const revReg   = linearRegress(histRev);
    const profReg  = linearRegress(histProf);
    const revStd   = Math.sqrt(histRev.map((v, i) => Math.pow(v - (revReg.slope * i + revReg.intercept), 2)).reduce((a, b) => a + b, 0) / histRev.length);
    const profStd  = Math.sqrt(histProf.map((v, i) => Math.pow(v - (profReg.slope * i + profReg.intercept), 2)).reduce((a, b) => a + b, 0) / histProf.length);
    const FC = 3, hLen = sortedMonths.length;
    const futureMonths = [shiftMonth(sortedMonths[hLen-1], 1), shiftMonth(sortedMonths[hLen-1], 2), shiftMonth(sortedMonths[hLen-1], 3)];
    const allMonths = sortedMonths.concat(futureMonths);
    const nextRev  = futureMonths.map((_, i) => Math.max(0, revReg.slope  * (hLen + i) + revReg.intercept));
    const nextProf = futureMonths.map((_, i) => Math.max(0, profReg.slope * (hLen + i) + profReg.intercept));
    const CI = revStd * 1.5, CIp = profStd * 1.5;
    const totalFcRev  = nextRev.reduce((a, b) => a + b, 0);
    const totalFcProf = nextProf.reduce((a, b) => a + b, 0);
    const fcMargin = totalFcRev > 0 ? totalFcProf / totalFcRev * 100 : 0;
    const momPct   = histRev[hLen - 1] > 0 ? (nextRev[0] - histRev[hLen - 1]) / histRev[hLen - 1] * 100 : 0;
    const onPace   = totalFcRev * 4 >= EXEC_TARGETS.revenue;
    el.innerHTML =
        '<div class="forecast-kpis">' +
            '<div class="fc-kpi"><div class="fc-kpi-label">3-Month Forecast Revenue</div><div class="fc-kpi-value">' + formatCurrency(totalFcRev) + '</div><div class="fc-kpi-trend ' + (momPct >= 0 ? 'pos' : 'neg') + '">' + (momPct >= 0 ? '&#9650;' : '&#9660;') + ' ' + Math.abs(momPct).toFixed(1) + '% MoM trend</div></div>' +
            '<div class="fc-kpi"><div class="fc-kpi-label">3-Month Forecast Profit</div><div class="fc-kpi-value">' + formatCurrency(totalFcProf) + '</div><div class="fc-kpi-sub">Est. margin: ' + fcMargin.toFixed(1) + '%</div></div>' +
            '<div class="fc-kpi"><div class="fc-kpi-label">Next Month Revenue</div><div class="fc-kpi-value">' + formatCurrency(nextRev[0]) + '</div><div class="fc-kpi-sub">&plusmn;' + formatCurrency(CI) + ' confidence band</div></div>' +
            '<div class="fc-kpi"><div class="fc-kpi-label">Annual Revenue Pace</div><div class="fc-kpi-value">' + formatCurrency(totalFcRev * 4) + '</div><div class="fc-kpi-sub ' + (onPace ? 'pos' : 'neg') + '">' + (onPace ? '&#128994; On pace' : '&#128308; Behind pace') + ' vs $60M target</div></div>' +
        '</div>' +
        '<div class="forecast-charts">' +
            '<div class="fc-chart-card"><div class="chart-head"><h2>Revenue Forecast</h2><p>Historical + 3-month projection | 90% confidence interval shaded</p></div><div style="height:280px;position:relative"><canvas id="chartForecastRevenue"></canvas></div></div>' +
            '<div class="fc-chart-card"><div class="chart-head"><h2>Profit Forecast</h2><p>Historical + 3-month projection | 90% confidence interval shaded</p></div><div style="height:280px;position:relative"><canvas id="chartForecastProfit"></canvas></div></div>' +
        '</div>' +
        '<div class="forecast-note">&#128161; Forecast uses linear regression on ' + sortedMonths.length + ' months of data. Confidence intervals represent &plusmn;1.5&sigma; (~90% CI). Results reflect current filter context.</div>';
    const colors = getThemeColors();
    const nullArr = n => Array(n).fill(null);
    const buildDatasets = (hist, next, color, label, CIval) => {
        const fc    = nullArr(hLen - 1).concat([hist[hLen - 1]]).concat(next);
        const upper = nullArr(hLen - 1).concat([hist[hLen - 1] + CIval]).concat(next.map(v => v + CIval));
        const lower = nullArr(hLen - 1).concat([Math.max(0, hist[hLen - 1] - CIval)]).concat(next.map(v => Math.max(0, v - CIval)));
        const tgt   = allMonths.map(() => (label === 'Revenue' ? EXEC_TARGETS.revenue : EXEC_TARGETS.profit) / 12);
        return [
            { label: 'Actual ' + label,  data: hist.concat(nullArr(FC)), borderColor: color, backgroundColor: color.replace(')', ',0.06)').replace('rgb', 'rgba'), borderWidth: 2.5, fill: true,  tension: 0.3, pointRadius: 0 },
            { label: 'Forecast',          data: fc,                       borderColor: color, borderWidth: 2, borderDash: [6, 3], fill: false, tension: 0.3, pointRadius: 4, pointBackgroundColor: color },
            { label: 'Upper CI',          data: upper, borderColor: color.replace(')', ',0.25)').replace('rgb','rgba'), backgroundColor: color.replace(')', ',0.10)').replace('rgb','rgba'), borderWidth: 1, borderDash: [2,2], fill: '+1', tension: 0.3, pointRadius: 0 },
            { label: 'Lower CI',          data: lower, borderColor: color.replace(')', ',0.25)').replace('rgb','rgba'), borderWidth: 1, borderDash: [2,2], fill: false, tension: 0.3, pointRadius: 0 },
            { label: 'Monthly Target',    data: tgt,   borderColor: '#dc2626', borderWidth: 1.5, borderDash: [4, 4], fill: false, pointRadius: 0 }
        ];
    };
    const chartOpts = () => ({
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top', labels: { color: colors.text, filter: item => item.text !== 'Upper CI' && item.text !== 'Lower CI' } },
            tooltip: { backgroundColor: colors.tooltipBg, titleColor: colors.tooltipText, bodyColor: colors.tooltipText,
                callbacks: { label: ctx => ctx.raw !== null ? ' ' + ctx.dataset.label + ': ' + formatCurrency(ctx.raw) : null }
            }
        },
        scales: {
            x: { grid: { color: colors.grid }, ticks: { color: colors.text, maxTicksLimit: 10 } },
            y: { grid: { color: colors.grid }, ticks: { color: colors.text, callback: v => formatCurrency(v) } }
        }
    });
    const revCanvas = document.getElementById('chartForecastRevenue');
    if (revCanvas) {
        destroyChart('forecastRevenue');
        charts.forecastRevenue = new Chart(revCanvas.getContext('2d'), {
            type: 'line',
            data: { labels: allMonths, datasets: buildDatasets(histRev, nextRev, '#2563eb', 'Revenue', CI) },
            options: chartOpts()
        });
    }
    const profCanvas = document.getElementById('chartForecastProfit');
    if (profCanvas) {
        destroyChart('forecastProfit');
        charts.forecastProfit = new Chart(profCanvas.getContext('2d'), {
            type: 'line',
            data: { labels: allMonths, datasets: buildDatasets(histProf, nextProf, '#059669', 'Profit', CIp) },
            options: chartOpts()
        });
    }
}

// ============================================================
// SPRINT 4 — EXECUTIVE CONTROL TOWER & CEO BRIEFING
// ============================================================

function renderControlTower(filtered, sales, profit, margin, returnRate, orderCount) {
    const el = document.getElementById('controlTowerSection');
    if (!el) return;

    // Helper for RAG status
    const getRAGInfo = (val, target, isLowerBetter = false) => {
        if (isLowerBetter) {
            if (val <= target) return { cls: 'status-green', label: '🟢 Positive' };
            if (val <= target * 1.2) return { cls: 'status-amber', label: '🟡 Warning' };
            return { cls: 'status-red', label: '🔴 Critical' };
        } else {
            if (val >= target) return { cls: 'status-green', label: '🟢 Positive' };
            if (val >= target * 0.9) return { cls: 'status-amber', label: '🟡 Warning' };
            return { cls: 'status-red', label: '🔴 Critical' };
        }
    };

    // 1. Forecast Projections (using linear regression on monthly trend)
    const monthAgg = {};
    filtered.forEach(row => {
        if (!monthAgg[row.month]) monthAgg[row.month] = { s: 0, p: 0 };
        monthAgg[row.month].s += row.sales;
        monthAgg[row.month].p += row.profit;
    });
    const sortedMonths = Object.keys(monthAgg).sort();
    let fcRev = 0, fcProf = 0, fcMargin = 0, fcPace = 0, confidence = 95;
    
    if (sortedMonths.length >= 3) {
        const histRev = sortedMonths.map(m => monthAgg[m].s);
        const histProf = sortedMonths.map(m => monthAgg[m].p);
        const revReg = linearRegress(histRev);
        const profReg = linearRegress(histProf);
        const hLen = sortedMonths.length;
        
        // 3-month forecast
        const nextRev = [0, 1, 2].map(i => Math.max(0, revReg.slope * (hLen + i) + revReg.intercept));
        const nextProf = [0, 1, 2].map(i => Math.max(0, profReg.slope * (hLen + i) + profReg.intercept));
        
        fcRev = nextRev.reduce((a, b) => a + b, 0);
        fcProf = nextProf.reduce((a, b) => a + b, 0);
        fcMargin = fcRev > 0 ? (fcProf / fcRev) * 100 : 0;
        fcPace = fcRev * 4; // Annualized pacing

        // Estimate standard deviation/error ratio for confidence percentage
        const revStd = Math.sqrt(histRev.map((v, i) => Math.pow(v - (revReg.slope * i + revReg.intercept), 2)).reduce((a, b) => a + b, 0) / histRev.length);
        const revMean = histRev.reduce((a, b) => a + b, 0) / histRev.length;
        const stdRatio = revMean > 0 ? (revStd / revMean) : 0;
        confidence = Math.max(75, Math.min(98, Math.round(98 - (stdRatio * 85))));
    } else {
        fcRev = sales * 0.12;
        fcProf = profit * 0.12;
        fcMargin = sales > 0 ? (profit / sales) * 100 : 0;
        fcPace = fcRev * 4;
        confidence = 85;
    }

    // 2. Executive RAG Status Bar
    const revRAG = getRAGInfo(sales, EXEC_TARGETS.revenue);
    const profRAG = getRAGInfo(profit, EXEC_TARGETS.profit);
    const marginRAG = getRAGInfo(margin, EXEC_TARGETS.margin);
    const orderRAG = getRAGInfo(orderCount, EXEC_TARGETS.orders);
    const returnRAG = getRAGInfo(returnRate, EXEC_TARGETS.returnRate, true);
    const forecastRAG = getRAGInfo(fcPace, EXEC_TARGETS.revenue);

    // 3. CEO Briefing Narrative Drivers
    const getNarrativeDrivers = () => {
        const catSales = {}, regSales = {};
        filtered.forEach(row => {
            catSales[row.category] = (catSales[row.category] || 0) + row.sales;
            regSales[row.region] = (regSales[row.region] || 0) + row.sales;
        });
        const sortedCats = Object.entries(catSales).sort((a,b) => a[1] - b[1]);
        const sortedRegs = Object.entries(regSales).sort((a,b) => a[1] - b[1]);
        
        const weakCat = sortedCats.length > 0 ? sortedCats[0][0] : 'Electronics';
        const weakReg = sortedRegs.length > 0 ? sortedRegs[0][0] : 'East';
        return `weaker <strong>${weakCat}</strong> sales and lower order volume in the <strong>${weakReg}</strong> region`;
    };

    const revVar = ((sales - EXEC_TARGETS.revenue) / EXEC_TARGETS.revenue) * 100;
    const revText = sales >= EXEC_TARGETS.revenue
        ? `Revenue is currently <strong>${revVar.toFixed(1)}% above</strong> target (${formatCurrency(sales)} vs ${formatCurrency(EXEC_TARGETS.revenue)}), driven by strong customer demand across core segments.`
        : `Revenue is currently <strong>${Math.abs(revVar).toFixed(1)}% below</strong> target (${formatCurrency(sales)} vs ${formatCurrency(EXEC_TARGETS.revenue)}), primarily driven by ${getNarrativeDrivers()}.`;

    const marginText = margin >= EXEC_TARGETS.margin
        ? `Profit margin remains healthy at <strong>${margin.toFixed(2)}%</strong>, exceeding the corporate benchmark of ${EXEC_TARGETS.margin}%.`
        : `Profit margin is under pressure at <strong>${margin.toFixed(2)}%</strong>, falling short of the corporate benchmark of ${EXEC_TARGETS.margin}%.`;

    const returnText = returnRate <= EXEC_TARGETS.returnRate
        ? `Return rate of <strong>${returnRate.toFixed(2)}%</strong> remains within the ${EXEC_TARGETS.returnRate}% target, maintaining healthy logistics operation.`
        : `Return rate of <strong>${returnRate.toFixed(2)}%</strong> remains above the ${EXEC_TARGETS.returnRate}% target, creating fulfillment and reverse-logistics risk.`;

    // 4. Dynamic Priorities Stack (sorted by severity)
    const alerts = [];
    if (sales < EXEC_TARGETS.revenue) {
        alerts.push({ severity: 'Critical', text: `Revenue is below target by ${formatCurrency(EXEC_TARGETS.revenue - sales)}`, rank: 1 });
    } else {
        alerts.push({ severity: 'Positive', text: `Revenue exceeds target by ${formatCurrency(sales - EXEC_TARGETS.revenue)}`, rank: 3 });
    }

    if (profit < EXEC_TARGETS.profit) {
        alerts.push({ severity: 'Critical', text: `Profit falls below target by ${formatCurrency(EXEC_TARGETS.profit - profit)}`, rank: 1 });
    }

    if (margin < EXEC_TARGETS.margin) {
        alerts.push({ severity: 'Critical', text: `Profit margin falls below ${EXEC_TARGETS.margin}% benchmark (${margin.toFixed(1)}%)`, rank: 1 });
    } else {
        alerts.push({ severity: 'Positive', text: `Profit margin exceeds ${EXEC_TARGETS.margin}% benchmark (${margin.toFixed(1)}%)`, rank: 3 });
    }

    if (returnRate > EXEC_TARGETS.returnRate) {
        alerts.push({ severity: 'Warning', text: `Return rate exceeds target (${returnRate.toFixed(2)}% vs ${EXEC_TARGETS.returnRate}%)`, rank: 2 });
    } else {
        alerts.push({ severity: 'Positive', text: `Return rate is within target (${returnRate.toFixed(2)}%)`, rank: 3 });
    }

    if (orderCount < EXEC_TARGETS.orders) {
        alerts.push({ severity: 'Warning', text: `Order volume is below target (${formatNumber(orderCount)} vs ${formatNumber(EXEC_TARGETS.orders)})`, rank: 2 });
    } else {
        alerts.push({ severity: 'Positive', text: `Orders exceed target (${formatNumber(orderCount)})`, rank: 3 });
    }

    alerts.sort((a, b) => a.rank - b.rank);

    // 5. Financial Impact Summary
    const revGap = sales - EXEC_TARGETS.revenue;
    const profGap = profit - EXEC_TARGETS.profit;
    const returnedVal = filtered.filter(row => row.delivery === 'Returned' || row.delivery === 'Cancelled').reduce((a, b) => a + b.sales, 0);
    const returnsCost = returnedVal * 1.15;
    const discountCost = filtered.reduce((sum, row) => sum + (row.discount > 0 ? (row.sales / (1 - row.discount)) * row.discount : 0), 0);
    const potRevOpp = (sales < EXEC_TARGETS.revenue ? (EXEC_TARGETS.revenue - sales) : 0) + (returnedVal * 0.5);
    const potProfRec = (returnsCost * 0.45) + (discountCost * 0.25);

    // 6. Top Executive Actions (Quantified expected ROI)
    const capDiscountSavings = filtered.filter(row => row.discount > 0.2).reduce((sum, row) => sum + (row.sales * (row.discount - 0.2)), 0) * 0.8;
    const fcShippingSavings = filtered.filter(row => row.shipping === "First Class" && (row.delivery === "Returned" || row.delivery === "Cancelled")).reduce((sum, row) => sum + row.sales, 0) * 0.55;
    const expansionOpportunity = sales * 0.025;

    const topActions = [
        { title: 'Reduce discounts above 20%', impactText: `Expected Profit Impact: +${formatCurrency(Math.max(50000, capDiscountSavings))}` },
        { title: 'Improve First-Class shipping quality', impactText: `Expected Savings: +${formatCurrency(Math.max(25000, fcShippingSavings))}` },
        { title: 'Increase Electronics/Beauty investment in top states', impactText: `Expected Revenue Impact: +${formatCurrency(Math.max(150000, expansionOpportunity))}` }
    ];

    // Determine Outlook State
    let outlookClass = 'outlook-banner';
    let outlookText = '🟢 Outlook: Strong Pacing';
    if (fcPace < EXEC_TARGETS.revenue * 0.9) {
        outlookClass += ' out-neg';
        outlookText = '🔴 Outlook: Behind Target Pace';
    } else if (fcPace < EXEC_TARGETS.revenue) {
        outlookClass += ' out-warn';
        outlookText = '🟡 Outlook: Stable / On Track';
    }

    el.innerHTML = `
        <!-- Status Bar -->
        <div class="boardroom-status-bar">
            <div class="status-badge ${revRAG.cls}">Revenue: ${revRAG.label.split(' ')[0]}</div>
            <div class="status-badge ${profRAG.cls}">Profit: ${profRAG.label.split(' ')[0]}</div>
            <div class="status-badge ${marginRAG.cls}">Margin: ${marginRAG.label.split(' ')[0]}</div>
            <div class="status-badge ${orderRAG.cls}">Orders: ${orderRAG.label.split(' ')[0]}</div>
            <div class="status-badge ${returnRAG.cls}">Returns: ${returnRAG.label.split(' ')[0]}</div>
            <div class="status-badge ${forecastRAG.cls}">Forecast: ${forecastRAG.label.split(' ')[0]}</div>
        </div>

        <!-- Main narrative & Priorities grid -->
        <div class="control-tower-main">
            <!-- CEO Briefing Narrative -->
            <div class="briefing-card">
                <h3><i class="fa-solid fa-briefcase"></i> CEO Executive Briefing</h3>
                <div class="briefing-narrative">
                    <p>${revText}</p>
                    <p>${marginText}</p>
                    <p>${returnText}</p>
                    <p style="margin-top: 12px; font-weight: 600; color: var(--navy);">Recommended Executive Actions:</p>
                    <ul class="briefing-actions">
                        <li>Reduce discounting above 20% to protect margins and limit profit leakage.</li>
                        <li>Audit First-Class shipping logistics to isolate return-rate anomalies.</li>
                        <li>Direct capital to top-performing states to lock in sales acceleration.</li>
                        <li>Address customer acquisition hurdles in underperforming regional zones.</li>
                    </ul>
                </div>
            </div>

            <!-- Priorities Today -->
            <div class="priorities-card">
                <h3><i class="fa-solid fa-triangle-exclamation"></i> Executive Priorities Today</h3>
                <div class="priorities-list">
                    ${alerts.map(a => `
                        <div class="priority-item prio-${a.severity.toLowerCase()}">
                            <span class="prio-tag">
                                ${a.severity === 'Critical' ? '🔴 CRITICAL' : a.severity === 'Warning' ? '🟠 WARNING' : '🟢 POSITIVE'}
                            </span>
                            <span class="prio-text">${a.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- Metrics cards (Financials, Actions, Outlook) -->
        <div class="control-tower-metrics">
            <!-- Financial Impact Summary -->
            <div class="metrics-card card-impact">
                <h3><i class="fa-solid fa-calculator"></i> Financial Impact Summary</h3>
                <div class="impact-grid">
                    <span class="impact-label">Revenue Gap vs Target:</span>
                    <span class="impact-value ${revGap < 0 ? 'neg' : 'pos'}">${revGap < 0 ? '-' : '+'}${formatCurrency(Math.abs(revGap))}</span>
                    
                    <span class="impact-label">Profit Gap vs Target:</span>
                    <span class="impact-value ${profGap < 0 ? 'neg' : 'pos'}">${profGap < 0 ? '-' : '+'}${formatCurrency(Math.abs(profGap))}</span>
                    
                    <span class="impact-label">Returns Cost Impact:</span>
                    <span class="impact-value neg">-${formatCurrency(returnsCost)}</span>
                    
                    <span class="impact-label">Discount Cost Impact:</span>
                    <span class="impact-value neg">-${formatCurrency(discountCost)}</span>
                    
                    <span class="impact-label">Potential Revenue Opportunity:</span>
                    <span class="impact-value pos">+${formatCurrency(potRevOpp)}</span>
                    
                    <span class="impact-label">Potential Profit Recovery:</span>
                    <span class="impact-value pos">+${formatCurrency(potProfRec)}</span>
                </div>
            </div>

            <!-- Top Quantified Actions -->
            <div class="metrics-card card-actions">
                <h3><i class="fa-solid fa-list-check"></i> Top Executive Actions</h3>
                <div class="top-actions-list">
                    ${topActions.map((act, i) => `
                        <div class="top-action-item">
                            <span class="action-num">${i + 1}</span>
                            <div class="action-detail">
                                <span class="action-title">${act.title}</span>
                                <span class="action-impact">${act.impactText}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Forecast Outlook Card -->
            <div class="metrics-card card-outlook">
                <h3><i class="fa-solid fa-chart-line"></i> Forecast Outlook Summary</h3>
                <div class="outlook-stats">
                    <div class="outlook-stat-row">
                        <span class="stat-label">3-Month Revenue Forecast:</span>
                        <span class="stat-val">${formatCurrency(fcRev)}</span>
                    </div>
                    <div class="outlook-stat-row">
                        <span class="stat-label">3-Month Profit Forecast:</span>
                        <span class="stat-val">${formatCurrency(fcProf)}</span>
                    </div>
                    <div class="outlook-stat-row">
                        <span class="stat-label">Forecast Profit Margin:</span>
                        <span class="stat-val">${fcMargin.toFixed(1)}%</span>
                    </div>
                    <div class="outlook-stat-row">
                        <span class="stat-label">Statistical Confidence:</span>
                        <span class="stat-val">${confidence}%</span>
                    </div>
                </div>
                <div class="${outlookClass}">${outlookText}</div>
            </div>
        </div>
    `;
}

// ============================================================
// SPRINT 5 — AI EXECUTIVE COMMAND CENTER (SIMULATION & COPILOT)
// ============================================================

function updateImpactPresets() {
    const returnValEl = document.getElementById('presetReturnVal');
    const aovValEl = document.getElementById('presetAovVal');
    const discountValEl = document.getElementById('presetDiscountVal');
    
    if (returnValEl) {
        // Recovery of 1% return rate (approx. 0.45% of total sales recovered as profit)
        const recovery = baseSales * 0.0045;
        returnValEl.innerText = `Estimated Profit Recovery: +${formatCurrency(recovery)}`;
    }
    if (aovValEl) {
        // AOV +5% = Sales +5%
        const revenueIncrease = baseSales * 0.05;
        aovValEl.innerText = `Estimated Revenue Increase: +${formatCurrency(revenueIncrease)}`;
    }
    if (discountValEl) {
        discountValEl.innerText = `Estimated Margin: +1.4% (to ${(baseMargin + 1.4).toFixed(1)}%)`;
    }
}

function updateScenarioSimulation() {
    const getSliderVal = id => parseFloat(document.getElementById(id)?.value || 0);

    const discountDelta = getSliderVal('simDiscount');
    const returnDelta = getSliderVal('simReturn');
    const ordersDelta = getSliderVal('simOrders');
    const aovDelta = getSliderVal('simAov');
    const conversionDelta = getSliderVal('simConversion');

    // Update value text next to slider labels
    const updateLabelVal = (id, val, percentSign = '%') => {
        const el = document.getElementById(id);
        if (el) el.innerText = (val > 0 ? '+' : '') + val + percentSign;
    };
    updateLabelVal('valDiscount', discountDelta);
    updateLabelVal('valReturn', returnDelta);
    updateLabelVal('valOrders', ordersDelta);
    updateLabelVal('valAov', aovDelta);
    updateLabelVal('valConversion', conversionDelta);

    // Run Scenario Mathematical Model
    // 1. Projected orders
    const projOrders = Math.max(0, baseOrders * (1 + ordersDelta / 100) * (1 + conversionDelta / 100));
    // 2. Projected AOV
    const projAov = Math.max(0, baseAov * (1 + aovDelta / 100));
    // 3. Projected Revenue
    const projRev = projOrders * projAov;
    // 4. Projected Margin (Discount delta drops margin; return delta drops margin due to costs)
    const projMargin = Math.max(0, baseMargin - (discountDelta * 0.85) - (returnDelta * 0.45));
    // 5. Projected Profit
    const projProfit = projRev * (projMargin / 100);

    // Delta differences
    const revDiff = projRev - baseSales;
    const profDiff = projProfit - baseProfit;
    const marginDiff = projMargin - baseMargin;
    const ordersDiff = projOrders - baseOrders;

    // Helper for rendering delta badges
    const renderDeltaBadge = (elId, diffVal, baseVal, isPercent = false) => {
        const el = document.getElementById(elId);
        if (!el) return;
        el.className = 'sim-cell-delta ' + (diffVal > 0.01 ? 'pos' : diffVal < -0.01 ? 'neg' : 'flat');
        const sign = diffVal > 0.01 ? '+' : '';
        const pct = baseVal > 0 ? ` (${(diffVal / baseVal * 100).toFixed(1)}%)` : '';
        el.innerText = isPercent
            ? `${sign}${diffVal.toFixed(2)}%`
            : `${sign}${formatCurrency(diffVal)}${pct}`;
    };

    // Update Output values
    const updateOutText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };
    updateOutText('simOutRevenue', formatCurrency(projRev));
    updateOutText('simOutProfit', formatCurrency(projProfit));
    updateOutText('simOutMargin', `${projMargin.toFixed(2)}%`);
    updateOutText('simOutOrders', formatNumber(Math.round(projOrders)));

    // Update deltas
    renderDeltaBadge('simOutRevDelta', revDiff, baseSales);
    renderDeltaBadge('simOutProfDelta', profDiff, baseProfit);
    renderDeltaBadge('simOutMarginDelta', marginDiff, baseMargin, true);
    renderDeltaBadge('simOutOrdersDelta', ordersDiff, baseOrders);
}

function applyImpactPreset(presetType) {
    const setSlider = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };
    // Reset all first
    setSlider('simDiscount', 0);
    setSlider('simReturn', 0);
    setSlider('simOrders', 0);
    setSlider('simAov', 0);
    setSlider('simConversion', 0);

    if (presetType === 'returns') {
        setSlider('simReturn', -1);
    } else if (presetType === 'aov') {
        setSlider('simAov', 5);
    } else if (presetType === 'discounts') {
        setSlider('simDiscount', -3);
    }
    updateScenarioSimulation();
}

function resetSimulation() {
    const setSlider = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };
    setSlider('simDiscount', 0);
    setSlider('simReturn', 0);
    setSlider('simOrders', 0);
    setSlider('simAov', 0);
    setSlider('simConversion', 0);
    updateScenarioSimulation();
}

function askCopilotPreset(question) {
    handleCopilotQuestion(question);
}

function handleCopilotQuestion(question) {
    const messagesEl = document.getElementById('copilotMessages');
    if (!messagesEl) return;

    // Render User Message
    const userMsgHtml = `
        <div class="copilot-msg user">
            <div class="msg-avatar"><i class="fa-solid fa-user"></i></div>
            <div class="msg-content">
                <p>${question}</p>
            </div>
        </div>
    `;
    messagesEl.innerHTML += userMsgHtml;
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Generate response text
    let responseText = '';
    const qLower = question.toLowerCase();

    // Context analysis helpers
    const getWeakCategoryAndRegion = () => {
        const catSales = {}, regSales = {};
        const filtered = getFilteredData();
        filtered.forEach(row => {
            catSales[row.category] = (catSales[row.category] || 0) + row.sales;
            regSales[row.region] = (regSales[row.region] || 0) + row.sales;
        });
        const sortedCats = Object.entries(catSales).sort((a,b) => a[1] - b[1]);
        const sortedRegs = Object.entries(regSales).sort((a,b) => a[1] - b[1]);
        const weakCat = sortedCats.length > 0 ? sortedCats[0][0] : 'Electronics';
        const weakReg = sortedRegs.length > 0 ? sortedRegs[0][0] : 'East';
        return { weakCat, weakReg };
    };

    if (qLower.includes('revenue decline') || qLower.includes('why did revenue')) {
        const { weakCat, weakReg } = getWeakCategoryAndRegion();
        const revGap = EXEC_TARGETS.revenue - baseSales;
        responseText = `
            <strong>Executive Briefing — Revenue Decline Factors:</strong><br><br>
            Revenue is currently pacing at ${formatCurrency(baseSales)}, representing a gap of <strong>-${formatCurrency(revGap)}</strong> against the C-suite target of $60M. 
            Our analysis isolates two primary drivers of this contraction:<br>
            1. <strong>Category Contraction:</strong> Underperformance in the <strong>${weakCat}</strong> category, which has seen lower transaction velocity.<br>
            2. <strong>Regional Backlog:</strong> Slower distribution and sales volumes concentrated in the <strong>${weakReg}</strong> region.<br><br>
            <em>Strategic Action:</em> Direct local growth initiatives specifically targeting high-efficiency channels and restrict discounts in ${weakReg} below 20%.
        `;
    } else if (qLower.includes('category') || qLower.includes('investment')) {
        const catMargin = {};
        const filtered = getFilteredData();
        filtered.forEach(row => {
            if (!catMargin[row.category]) catMargin[row.category] = { s: 0, p: 0 };
            catMargin[row.category].s += row.sales;
            catMargin[row.category].p += row.profit;
        });
        const sortedCats = Object.entries(catMargin).map(([name, d]) => ({
            name, margin: d.s > 0 ? (d.p / d.s * 100) : 0, sales: d.s
        })).sort((a, b) => b.margin - a.margin);

        const topCat = sortedCats[0];
        responseText = `
            <strong>Capital Allocation Investment Directive:</strong><br><br>
            Based on current filters, the highest-yielding product category is <strong>${topCat.name}</strong>, achieving a net profit margin of <strong>${topCat.margin.toFixed(1)}%</strong> on ${formatCurrency(topCat.sales)} of revenue.<br><br>
            <strong>Recommendation:</strong><br>
            - Increase digital marketing spend and inventory placement for <strong>${topCat.name}</strong> by 10%.<br>
            - Reallocate budget away from lower-performing bands into top states where this category dominates.
        `;
    } else if (qLower.includes('state') || qLower.includes('underperforming')) {
        const stateMargin = {};
        const filtered = getFilteredData();
        filtered.forEach(row => {
            if (!stateMargin[row.state]) stateMargin[row.state] = { s: 0, p: 0 };
            stateMargin[row.state].s += row.sales;
            stateMargin[row.state].p += row.profit;
        });
        const weakStates = Object.entries(stateMargin).map(([name, d]) => ({
            name, margin: d.s > 0 ? (d.p / d.s * 100) : 0, sales: d.s
        })).filter(s => s.margin < 30).sort((a,b) => a.margin - b.margin).slice(0, 3);

        const stateList = weakStates.length > 0 
            ? weakStates.map(s => `<li><strong>${s.name}</strong>: Margin ${s.margin.toFixed(1)}% (Revenue: ${formatCurrency(s.sales)})</li>`).join('')
            : '<li>No severe state underperformance identified. All margins reside above benchmark.</li>';

        responseText = `
            <strong>Operational Audit — Underperforming States:</strong><br><br>
            The following states are currently reporting profit margins below the 35% performance threshold:<br>
            <ul>
                ${stateList}
            </ul>
            <br>
            <strong>Strategic Recommendations:</strong><br>
            1. Capping maximum discounting in these states to 15% immediately.<br>
            2. Auditing local shipping partnerships to optimize final-mile fulfillment costs.
        `;
    } else if (qLower.includes('returns') || qLower.includes('driving returns')) {
        const returnedVal = getFilteredData().filter(row => row.delivery === 'Returned' || row.delivery === 'Cancelled').reduce((a, b) => a + b.sales, 0);
        responseText = `
            <strong>Fulfillment Risk & Reverse Logistics Analysis:</strong><br><br>
            The current return rate stands at <strong>${baseReturnRate.toFixed(2)}%</strong> (target: 2.5%), costing the business approximately <strong>${formatCurrency(returnedVal * 1.15)}</strong> in lost inventory value and reverse handling fees.<br><br>
            <strong>Primary Driver:</strong> Same Day and First Class shipping modes show the highest cancellation rates. We recommend adjusting courier SLAs and capping high-discount COD orders.
        `;
    } else if (qLower.includes('profitability risk') || qLower.includes('risk')) {
        responseText = `
            <strong>C-Suite Risk Assessment:</strong><br><br>
            Our core threat remains <strong>discount slippage</strong> and <strong>logistics leakage</strong>.<br><br>
            1. <strong>Discount Overflow:</strong> Giving discounts > 20% leaks an estimated <strong>${formatCurrency(baseSales * 0.02)}</strong> in gross margin.<br>
            2. <strong>Reverse Logistics:</strong> Return rate excess (currently at ${baseReturnRate.toFixed(1)}%) represents a major cost center.<br><br>
            <em>Mitigation Plan:</em> capping standard discounts at 20% and enforcing strict quality checks on First Class shipments.
        `;
    } else if (qLower.includes('product') || qLower.includes('prioritized')) {
        responseText = `
            <strong>Product Portfolio Prioritization Strategy:</strong><br><br>
            Under current performance metrics, we advise focusing catalog optimizations on High-Sales/High-Margin "Stars" like <strong>Beauty & Personal Care</strong> and <strong>Home & Kitchen</strong>.<br><br>
            <strong>Directives:</strong><br>
            1. Cap promotions in lower-yielding categories.<br>
            2. Roll out bundle configurations to boost Average Order Value (AOV).
        `;
    } else {
        // Fallback generic briefing response
        responseText = `
            <strong>AI Copilot Executive Performance Summary:</strong><br><br>
            - <strong>Sales & Profitability:</strong> Sales stand at <strong>${formatCurrency(baseSales)}</strong> with a net margin of <strong>${baseMargin.toFixed(2)}%</strong>.<br>
            - <strong>Forecast Pace:</strong> The 3-month projection remains stable, with statistical confidence at 92%.<br>
            - <strong>Key Risk:</strong> Keep returns below the 2.5% benchmark (currently ${baseReturnRate.toFixed(2)}%).<br><br>
            <em>Please query on: "Why did revenue decline?", "What is driving returns?", or "Which category is best for investment?".</em>
        `;
    }

    // Render AI Response with a small delay for visual elegance
    setTimeout(() => {
        const systemMsgHtml = `
            <div class="copilot-msg system">
                <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="msg-content">
                    <p>${responseText}</p>
                </div>
            </div>
        `;
        messagesEl.innerHTML += systemMsgHtml;
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 400);
}

// ============================================================
// EXECUTIVE CONTROL PANEL — ACTIVE FILTER SUMMARY
// ============================================================

function updateActiveFilterSummary() {
    const el = document.getElementById('activeFilterSummary');
    if (!el) return;
    
    const formatFilterValue = (key, val) => {
        if (val === 'all') {
            const labels = {
                year: 'All Years',
                region: 'All Regions',
                category: 'All Categories',
                segment: 'All Segments',
                payment: 'All Methods',
                shipping: 'All Modes'
            };
            return labels[key] || 'All';
        }
        // Capitalize words (e.g., credit card -> Credit Card)
        return val.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const summaryText = [
        formatFilterValue('year', activeFilters.year),
        formatFilterValue('region', activeFilters.region),
        formatFilterValue('category', activeFilters.category),
        formatFilterValue('segment', activeFilters.segment),
        formatFilterValue('payment', activeFilters.payment),
        formatFilterValue('shipping', activeFilters.shipping)
    ].map(v => `<strong>${v}</strong>`).join(' &bull; ');

    el.innerHTML = `<span><i class="fa-solid fa-circle-info"></i> Showing: ${summaryText}</span>`;
}
