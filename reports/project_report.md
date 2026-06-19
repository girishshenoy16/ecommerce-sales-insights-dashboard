# Technical Project Report: E-Commerce Sales Insights & AI Command Center

**Author**: Lead Business Intelligence & Data Analyst  
**Date**: June 2026  
**Target Audience**: C-Suite Executives, Data Engineers, BI Developers  

---

![System Architecture & Command Center Mockup](../screenshots/dashboard_image.png)

---

## 1. Project Background and Objective
In modern retail, transaction platforms produce massive dumps of daily sales. Transforming this raw data into strategic decision intelligence is a core competitive requirement.

The **E-Commerce Sales Insights Dashboard** is an end-to-end data product. By ingest, automated cleaning, and multi-dimensional aggregation of **105,000+ orders**, we establish a single source of truth. The project culminates in a boardroom-ready **AI-Powered Executive Command Center** operating entirely client-side, allowing static server hosting (e.g. GitHub Pages) with millisecond-level responsiveness.

---

## 2. Dataset Ingestion & Schema
The raw database contains **105,075 records** representing e-commerce orders from Jan 2024 to Jun 2026:

| Attribute | Data Type | Description |
| :--- | :--- | :--- |
| **Order ID** | String | Alphanumeric order key (e.g. `ORD-2026-100001`). |
| **Customer ID** | String | Alphanumeric customer key (e.g. `CUST-10001`). |
| **Customer Name** | String | Customer full name. |
| **Gender** | Categorical | Customer gender (Male/Female). |
| **Order Date** | Datetime | Timestamp of transaction. |
| **Region** | Categorical | Geographical region (East, West, Central, South). |
| **State** | Categorical | Customer billing state (e.g. California, Texas). |
| **City** | Categorical | Customer billing city (e.g. Los Angeles, Houston). |
| **Product Category** | Categorical | Merchandise vertical (Electronics, Fashion, Home & Kitchen, etc.). |
| **Product Name** | String | Specific commercial item name. |
| **Quantity Sold** | Integer | Number of units purchased in the order. |
| **Unit Price** | Decimal | Retail price per single unit. |
| **Discount %** | Decimal | Applied promotional discount rate (0% to 25%). |
| **Sales Amount** | Decimal | Net revenue: `Quantity * Unit Price * (1 - Discount)`. |
| **Cost Amount** | Decimal | Cost of goods sold (COGS): `Quantity * Cost Price`. |
| **Profit Amount** | Decimal | Net profit: `Sales Amount - Cost Amount`. |
| **Profit Margin %** | Decimal | Profitability ratio: `(Profit Amount / Sales Amount) * 100`. |
| **Payment Method** | Categorical | Channel used (Credit Card, Debit Card, PayPal, COD, etc.). |
| **Shipping Mode** | Categorical | Speed priority (Standard, Second Class, First Class, Same Day). |
| **Delivery Status** | Categorical | Fulfillment stage (Delivered, Shipped, Returned, Cancelled). |
| **Customer Segment** | Categorical | Customer segment (Consumer, Corporate, Home Office). |

---

## 3. Data Cleaning & Preparation Pipeline
The automated ETL pipeline (`scripts/data_cleaning.py`) cleans and prepares the raw transaction data:
* **Duplicate Record Resolution**: Scans and drops **75 duplicate rows** caused by network retry events, validating a final dataset of exactly **105,000 records**.
* **Missing Value Imputation**: Imputes **0.5% missing records** in `Delivery Status` using the column mode ("Delivered") and **0.3%** in `Payment Method` with the column mode ("Credit Card").
* **Text Case Normalization**: Standardizes casing (e.g. `"electronics"` and `"HOME & KITCHEN"`) to title case to prevent segment duplication.
* **Date Parsing**: Standardizes date formats to `YYYY-MM-DD` and extracts `Year`, `YearMonth`, and `Month Name` for trend lines.
* **Financial Calculations Validation**: Re-calculates and rounds sales, cost, profit, and margin amounts to exactly 2 decimal places to resolve floating-point anomalies.
* **Aggregation**: Compiles and exports the data into a multi-dimensional JSON file (`docs/data/dashboard_data.json`), compressing the 38MB CSV into a highly structured 26MB JSON, enabling instant browser slicing.

---

## 4. Frontend Architecture & Design Systems
The web client (`docs/`) is engineered using vanilla HTML5, CSS3, and JavaScript, leveraging **Chart.js (v4)** and **FontAwesome (v6)**:
* **McKinsey-Style Control Panel**: Redesigns the filters into a premium horizontal control panel with icons and a dynamic active filter summary (`#activeFilterSummary`) showing the currently selected dimensions.
* **US Grid Cartogram Heatmap**: Builds a pure CSS-grid layout of the United States map where each state is a tile. Tiles are colored dynamically based on their profit margins (Green for high margins, Red for low margins), ensuring uniform size and readability compared to standard geo-maps.
* **Slate Theme Color Tokens**: Built using custom properties:
  - Background Theme: `--bg` (#F7F5F0) / Dark: `--bg` (#0f172a)
  - Surface Containers: `--surface` (#FFFFFF) / Dark: `--surface` (#1e293b)
  - Executive Color: `--navy` (#0F1B2D) / Dark: `--navy` (#f8fafc)

---

## 5. Strategic Decision Support & Simulation Engines
The command center introduces advanced predictive and prescriptive engines inside `docs/js/script.js`:

### 5.1. Revenue & Profit Forecasting Engine
Uses client-side **ordinary least squares (OLS) linear regression** to project future metrics based on historical Year-Month records:
* **Linear Regression Model**:
  $$\text{Slope } (\beta) = \frac{\sum_{i=1}^{n} (x_i - \bar{x})(y_i - \bar{y})}{\sum_{i=1}^{n} (x_i - \bar{x})^2}$$
  $$\text{Intercept } (\alpha) = \bar{y} - \beta\bar{x}$$
* **Confidence Shading**: Estimates standard error of the regression to shade the **80% confidence interval** (represented as $\pm 1.5\sigma$ bands).
* **Target Pacing**: Annualizes the 3-month forecast (`forecastRevenue * 4`) and checks it against the C-suite revenue goal ($60M) to update the status of the RAG forecast indicator.

### 5.2. Multivariable What-If Scenario Simulator
Calculates the dynamic financial outcome of adjusting key operational drivers:
* **Orders Simulation**: 
  $$\text{Simulated Orders} = \text{Baseline Orders} \times \left(1 + \frac{\Delta \text{ Volume}}{100}\right) \times \left(1 + \frac{\Delta \text{ Conversion}}{100}\right)$$
* **Projected Average Order Value (AOV)**:
  $$\text{Simulated AOV} = \text{Baseline AOV} \times \left(1 + \frac{\Delta \text{ AOV}}{100}\right)$$
* **Projected Revenue**:
  $$\text{Projected Revenue} = \text{Simulated Orders} \times \text{Simulated AOV}$$
* **Profitability Model**: Models discount and return margins, where capping discounts directly recovers profit while shipping return rate drops prevent reverse-logistics leakage:
  $$\text{Simulated Margin \%} = \text{Baseline Margin \%} - (\Delta \text{ Discount} \times 0.85) - (\Delta \text{ Return} \times 0.45)$$
* **Projected Profit**:
  $$\text{Projected Profit} = \text{Projected Revenue} \times \left(\frac{\text{Simulated Margin \%}}{100}\right)$$
* **Deltas**:
  $$\text{Revenue Delta} = \text{Projected Revenue} - \text{Baseline Revenue}$$
  $$\text{Profit Delta} = \text{Projected Profit} - \text{Baseline Profit}$$
  $$\text{Margin Delta} = \text{Simulated Margin \%} - \text{Baseline Margin \%}$$

### 5.3. Heuristic AI Copilot
Processes conversational user inputs using local keyword matching rules:
* **Natural Language Keyword Parsing**: Scans queries for keywords (`revenue`, `decline`, `returns`, `risk`, `investment`, `product`, `underperforming`).
* **Active Filter Integration**: Dynamically queries the filtered data array to identify the weakest category, worst-performing region, or underperforming states, producing context-specific strategic advice.
* **Stateful Response Generation**: Emits formatted HTML containing quantified performance indicators and bulleted corporate recommendations.
