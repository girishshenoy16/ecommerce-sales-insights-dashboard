import os
import json
import pandas as pd
import numpy as np

def clean_and_aggregate_data():
    raw_path = "data/raw_sales_data.csv"
    cleaned_path = "data/cleaned_sales_data.csv"
    dashboard_data_dir = "docs/data"
    dashboard_data_path = os.path.join(dashboard_data_dir, "dashboard_data.json")
    
    print("--------------------------------------------------")
    print("Starting Data Cleaning Pipeline (with Gender Support)...")
    print("--------------------------------------------------")
    
    # Check if raw data exists
    if not os.path.exists(raw_path):
        print(f"Error: Raw file {raw_path} not found. Please run generate_data.py first.")
        return
        
    # Load raw data
    df = pd.read_csv(raw_path)
    print(f"Loaded raw data: {df.shape[0]} rows, {df.shape[1]} columns.")
    
    # 1. Handling Duplicates
    num_dups = df.duplicated().sum()
    print(f"Detected duplicate rows: {num_dups}")
    if num_dups > 0:
        df = df.drop_duplicates()
        print(f"Removed duplicates. New row count: {len(df)}")
        
    # 2. Handling Missing Values
    print("\nChecking for missing values:")
    missing_vals = df.isnull().sum()
    for col, count in missing_vals.items():
        if count > 0:
            print(f" - Column '{col}': {count} missing values")
            
    # Impute missing values with mode/default values
    if df["Delivery Status"].isnull().sum() > 0:
        delivery_mode = df["Delivery Status"].mode()[0]
        df["Delivery Status"] = df["Delivery Status"].fillna(delivery_mode)
        print(f"Imputed missing 'Delivery Status' with mode value: '{delivery_mode}'")
        
    if df["Payment Method"].isnull().sum() > 0:
        payment_mode = df["Payment Method"].mode()[0]
        df["Payment Method"] = df["Payment Method"].fillna(payment_mode)
        print(f"Imputed missing 'Payment Method' with mode value: '{payment_mode}'")
        
    # Ensure gender has no null values
    if "Gender" in df.columns and df["Gender"].isnull().sum() > 0:
        gender_mode = df["Gender"].mode()[0]
        df["Gender"] = df["Gender"].fillna(gender_mode)
        print(f"Imputed missing 'Gender' with mode value: '{gender_mode}'")
        
    # Double check missing values
    remaining_missing = df.isnull().sum().sum()
    print(f"Remaining missing values in dataset: {remaining_missing}")
    
    # 3. Standardize Categories and Casings
    df["Product Category"] = df["Product Category"].astype(str).str.strip().str.title()
    df["Product Category"] = df["Product Category"].replace({
        "Electronics": "Electronics",
        "Home & Kitchen": "Home & Kitchen",
        "Fashion": "Fashion",
        "Beauty & Personal Care": "Beauty & Personal Care",
        "Sports & Outdoors": "Sports & Outdoors"
    })
    print("\nStandardized Product Categories:")
    print(df["Product Category"].unique())
    
    # Standardize segments, shipping modes, delivery status, and gender
    df["Customer Segment"] = df["Customer Segment"].str.strip().str.title()
    df["Shipping Mode"] = df["Shipping Mode"].str.strip().str.title()
    df["Delivery Status"] = df["Delivery Status"].str.strip().str.title()
    if "Gender" in df.columns:
        df["Gender"] = df["Gender"].str.strip().str.title()
    
    # 4. Date Formatting and Validation
    df["Order Date"] = pd.to_datetime(df["Order Date"])
    df["Order Date Formatted"] = df["Order Date"].dt.strftime("%Y-%m-%d")
    print(f"\nOrder dates standardized. Range: {df['Order Date'].min().strftime('%Y-%m-%d')} to {df['Order Date'].max().strftime('%Y-%m-%d')}")
    
    # Add calendar fields for aggregation
    df["Year"] = df["Order Date"].dt.year
    df["Month"] = df["Order Date"].dt.strftime("%Y-%m")
    df["Month Name"] = df["Order Date"].dt.strftime("%b")
    df["YearMonth"] = df["Order Date"].dt.strftime("%Y-%m")
    
    # 5. Financial Validation & Logic Enforcement
    print("\nValidating and correcting financial calculations...")
    df["Discount %"] = df["Discount %"].fillna(0.0)
    df["Sales Amount"] = np.round(df["Quantity Sold"] * df["Unit Price"] * (1 - df["Discount %"]), 2)
    df["Profit Amount"] = np.round(df["Sales Amount"] - df["Cost Amount"], 2)
    df["Profit Margin %"] = np.where(df["Sales Amount"] > 0, np.round((df["Profit Amount"] / df["Sales Amount"]) * 100, 2), 0.0)
    
    # 6. Outlier Detection
    print("\nPerforming Outlier Detection on Sales Amount:")
    q1 = df["Sales Amount"].quantile(0.25)
    q3 = df["Sales Amount"].quantile(0.75)
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    outliers = df[(df["Sales Amount"] < lower_bound) | (df["Sales Amount"] > upper_bound)]
    print(f" - IQR: ${iqr:.2f} (Q1: ${q1:.2f}, Q3: ${q3:.2f})")
    print(f" - Outlier bounds: ${lower_bound:.2f} to ${upper_bound:.2f}")
    print(f" - Number of outliers detected: {len(outliers)} ({len(outliers)/len(df)*100:.2f}% of data)")
    
    # 7. Save Cleaned Dataset
    os.makedirs(os.path.dirname(cleaned_path), exist_ok=True)
    df.to_csv(cleaned_path, index=False)
    print(f"\nCleaned dataset written successfully to: {cleaned_path}")
    
    # 8. Aggregating Data for the Interactive Web Dashboard
    print("\nPre-aggregating statistics for Web Dashboard...")
    os.makedirs(dashboard_data_dir, exist_ok=True)
    
    # A. KPI Metrics
    total_sales = float(df["Sales Amount"].sum())
    total_profit = float(df["Profit Amount"].sum())
    total_orders = int(df["Order ID"].nunique())
    avg_order_val = float(total_sales / total_orders) if total_orders > 0 else 0.0
    overall_margin = float((total_profit / total_sales) * 100) if total_sales > 0 else 0.0
    
    kpis = {
        "totalSales": round(total_sales, 2),
        "totalProfit": round(total_profit, 2),
        "totalOrders": total_orders,
        "averageOrderValue": round(avg_order_val, 2),
        "overallProfitMargin": round(overall_margin, 2)
    }
    
    # B. Multidimensional Granular Dataset (incorporates Gender)
    print("Generating multidimensional granular dataset (with Gender)...")
    granular_group = df.groupby([
        "Year", "YearMonth", "Region", "State", "Product Category", "Customer Segment", "Payment Method", "Shipping Mode", "Delivery Status", "Gender", "Discount %"
    ]).agg(
        sales=("Sales Amount", "sum"),
        profit=("Profit Amount", "sum"),
        quantity=("Quantity Sold", "sum"),
        orders=("Order ID", "nunique")
    ).reset_index()
    
    granular_list = []
    for _, row in granular_group.iterrows():
        granular_list.append({
            "year": int(row["Year"]),
            "month": row["YearMonth"],
            "region": row["Region"],
            "state": row["State"],
            "category": row["Product Category"],
            "segment": row["Customer Segment"],
            "payment": row["Payment Method"],
            "shipping": row["Shipping Mode"],
            "delivery": row["Delivery Status"],
            "gender": row["Gender"],
            "discount": float(row["Discount %"]),
            "sales": round(float(row["sales"]), 2),
            "profit": round(float(row["profit"]), 2),
            "quantity": int(row["quantity"]),
            "orders": int(row["orders"])
        })
        
    # C. Top Customers
    print("Aggregating top customer accounts...")
    top_cust = df.groupby(["Customer ID", "Customer Name", "Customer Segment", "Region"]).agg(
        sales=("Sales Amount", "sum"),
        profit=("Profit Amount", "sum"),
        orders=("Order ID", "nunique")
    ).reset_index().sort_values(by="sales", ascending=False).head(100)
    
    top_customers_list = []
    for _, row in top_cust.iterrows():
        top_customers_list.append({
            "customerId": row["Customer ID"],
            "name": row["Customer Name"],
            "segment": row["Customer Segment"],
            "region": row["Region"],
            "sales": round(float(row["sales"]), 2),
            "profit": round(float(row["profit"]), 2),
            "orders": int(row["orders"])
        })
        
    # D. Top Products
    print("Aggregating top product lines...")
    top_prod = df.groupby(["Product Name", "Product Category"]).agg(
        sales=("Sales Amount", "sum"),
        profit=("Profit Amount", "sum"),
        quantity=("Quantity Sold", "sum")
    ).reset_index().sort_values(by="sales", ascending=False).head(100)
    
    top_products_list = []
    for _, row in top_prod.iterrows():
        top_products_list.append({
            "product": row["Product Name"],
            "category": row["Product Category"],
            "sales": round(float(row["sales"]), 2),
            "profit": round(float(row["profit"]), 2),
            "quantity": int(row["quantity"])
        })

    # E. Filter Values List (with Gender support)
    filters = {
        "regions": sorted(df["Region"].unique().tolist()),
        "categories": sorted(df["Product Category"].unique().tolist()),
        "segments": sorted(df["Customer Segment"].unique().tolist()),
        "paymentMethods": sorted(df["Payment Method"].unique().tolist()),
        "years": sorted(df["Year"].unique().tolist()),
        "genders": sorted(df["Gender"].unique().tolist()) if "Gender" in df.columns else ["Female", "Male"],
        "shippings": sorted(df["Shipping Mode"].unique().tolist())
    }
    
    # Assemble final JSON package
    dashboard_data = {
        "kpis": kpis,
        "granularData": granular_list,
        "topCustomers": top_customers_list,
        "topProducts": top_products_list,
        "filters": filters
    }
    
    # Save to JSON (minified)
    with open(dashboard_data_path, "w") as f:
        json.dump(dashboard_data, f)

    print(f"Aggregated dashboard statistics written successfully to: {dashboard_data_path}")
    print(f"Granular records grouped: {len(granular_list)} records")
    
    print("--------------------------------------------------")
    print("Data Cleaning & Aggregation Pipeline Completed Successfully!")
    print("--------------------------------------------------")

if __name__ == "__main__":
    clean_and_aggregate_data()
