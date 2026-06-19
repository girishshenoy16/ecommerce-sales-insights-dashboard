import os
import random
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

def generate_ecom_dataset(num_rows=105000):
    print(f"Starting generation of {num_rows} records with Gender column...")
    
    # 1. Setup Customer Pool to allow repeat purchases
    num_customers = 15000
    segments = ["Consumer", "Corporate", "Home Office"]
    segment_weights = [0.55, 0.30, 0.15]
    
    male_first_names = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles",
                        "Christopher", "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua",
                        "Kenneth", "Kevin", "Brian", "George", "Timothy", "Ronald", "Edward", "Jason", "Jeffrey"]
                        
    female_first_names = ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen",
                          "Lisa", "Nancy", "Betty", "Sandra", "Margaret", "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Carol"]
                   
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
                  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
                  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"]

    # Geographical hierarchy
    geo_hierarchy = {
        "East": {
            "New York": ["New York City", "Buffalo", "Rochester", "Albany"],
            "Massachusetts": ["Boston", "Worcester", "Springfield", "Cambridge"],
            "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Erie"]
        },
        "West": {
            "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento"],
            "Washington": ["Seattle", "Spokane", "Tacoma", "Bellevue"],
            "Oregon": ["Portland", "Salem", "Eugene"]
        },
        "Central": {
            "Texas": ["Houston", "Austin", "Dallas", "San Antonio", "Fort Worth"],
            "Illinois": ["Chicago", "Naperville", "Aurora", "Rockford"],
            "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo"]
        },
        "South": {
            "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"],
            "Georgia": ["Atlanta", "Savannah", "Augusta", "Columbus"],
            "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham"]
        }
    }
    
    regions = list(geo_hierarchy.keys())
    
    customers = []
    for i in range(1, num_customers + 1):
        cust_id = f"CUST-{10000 + i}"
        gender = random.choices(["Male", "Female"], weights=[0.48, 0.52])[0]
        
        if gender == "Male":
            first_name = random.choice(male_first_names)
        else:
            first_name = random.choice(female_first_names)
            
        cust_name = f"{first_name} {random.choice(last_names)}"
        cust_segment = random.choices(segments, weights=segment_weights)[0]
        
        # Assign fixed location to each customer
        region = random.choice(regions)
        state = random.choice(list(geo_hierarchy[region].keys()))
        city = random.choice(geo_hierarchy[region][state])
        
        customers.append({
            "Customer ID": cust_id,
            "Customer Name": cust_name,
            "Gender": gender,
            "Customer Segment": cust_segment,
            "Region": region,
            "State": state,
            "City": city
        })
    
    customer_df = pd.DataFrame(customers)
    print(f"Customer pool of {num_customers} unique customers created with demographic fields.")
    
    # 2. Product database with consistent categories, unit prices and costs
    products_db = [
        # Electronics
        {"Category": "Electronics", "Name": "SmartPhone Pro Max", "Price": 999.0, "Cost": 550.0},
        {"Category": "Electronics", "Name": "Laptop EliteBook 15", "Price": 1299.0, "Cost": 750.0},
        {"Category": "Electronics", "Name": "Wireless Noise-Cancelling Headphones", "Price": 199.0, "Cost": 90.0},
        {"Category": "Electronics", "Name": "Smart Watch Active", "Price": 249.0, "Cost": 120.0},
        {"Category": "Electronics", "Name": "Bluetooth Portable Speaker", "Price": 79.0, "Cost": 35.0},
        {"Category": "Electronics", "Name": "Ultra-Wide Gaming Monitor 34\"", "Price": 449.0, "Cost": 250.0},
        # Fashion
        {"Category": "Fashion", "Name": "Premium Leather Jacket", "Price": 180.0, "Cost": 70.0},
        {"Category": "Fashion", "Name": "Designer Denim Jeans", "Price": 85.0, "Cost": 30.0},
        {"Category": "Fashion", "Name": "Athletic Running Shoes", "Price": 120.0, "Cost": 50.0},
        {"Category": "Fashion", "Name": "Classic Aviator Sunglasses", "Price": 60.0, "Cost": 20.0},
        {"Category": "Fashion", "Name": "Quartz Designer Watch", "Price": 150.0, "Cost": 65.0},
        # Home & Kitchen
        {"Category": "Home & Kitchen", "Name": "Digital Air Fryer XL", "Price": 129.0, "Cost": 60.0},
        {"Category": "Home & Kitchen", "Name": "Espresso Machine Pro", "Price": 599.0, "Cost": 320.0},
        {"Category": "Home & Kitchen", "Name": "Robotic Vacuum Cleaner", "Price": 299.0, "Cost": 140.0},
        {"Category": "Home & Kitchen", "Name": "Ergonomic Mesh Office Chair", "Price": 220.0, "Cost": 100.0},
        {"Category": "Home & Kitchen", "Name": "High-Speed Professional Blender", "Price": 99.0, "Cost": 40.0},
        # Beauty & Personal Care
        {"Category": "Beauty & Personal Care", "Name": "Hyaluronic Acid Skincare Serum", "Price": 45.0, "Cost": 12.0},
        {"Category": "Beauty & Personal Care", "Name": "Ionic Hair Dryer 2200W", "Price": 75.0, "Cost": 30.0},
        {"Category": "Beauty & Personal Care", "Name": "Luxury Eau de Parfum 100ml", "Price": 110.0, "Cost": 45.0},
        {"Category": "Beauty & Personal Care", "Name": "Eyeshadow Makeup Palette", "Price": 35.0, "Cost": 10.0},
        {"Category": "Beauty & Personal Care", "Name": "Sonic Electric Toothbrush", "Price": 80.0, "Cost": 28.0},
        # Sports & Outdoors
        {"Category": "Sports & Outdoors", "Name": "Non-Slip Yoga Mat 6mm", "Price": 29.0, "Cost": 9.0},
        {"Category": "Sports & Outdoors", "Name": "Waterproof Camping Tent 4-Person", "Price": 149.0, "Cost": 70.0},
        {"Category": "Sports & Outdoors", "Name": "Adjustable Dumbbells Set", "Price": 199.0, "Cost": 110.0},
        {"Category": "Sports & Outdoors", "Name": "Insulated Stainless Steel Water Bottle", "Price": 25.0, "Cost": 8.0},
        {"Category": "Sports & Outdoors", "Name": "Folding Mountain Bike", "Price": 349.0, "Cost": 180.0}
    ]
    
    # 3. Simulate Orders
    start_date = datetime(2024, 1, 1)
    end_date = datetime(2026, 6, 15)
    days_range = (end_date - start_date).days
    
    order_ids = [f"ORD-2026-{100000 + i}" for i in range(1, num_rows + 1)]
    
    payment_methods = ["Credit Card", "Debit Card", "PayPal", "Net Banking", "Cash on Delivery"]
    payment_weights = [0.45, 0.15, 0.20, 0.10, 0.10]
    
    shipping_modes = ["Standard Class", "Second Class", "First Class", "Same Day"]
    shipping_weights = [0.60, 0.20, 0.15, 0.05]
    
    delivery_statuses = ["Delivered", "Shipped", "In Transit", "Cancelled", "Returned"]
    delivery_weights = [0.92, 0.03, 0.02, 0.015, 0.015]
    
    dates = []
    print("Generating order dates with seasonal patterns...")
    for i in range(num_rows):
        rand_days = random.randint(0, days_range)
        current_date = start_date + timedelta(days=rand_days)
        
        # Apply monthly weights
        month = current_date.month
        prob = 1.0
        if month in [11]:
            prob = 1.5
        elif month in [12]:
            prob = 1.8
        elif month in [7]:
            prob = 1.3
        elif month in [1, 2]:
            prob = 0.7
            
        if random.random() <= (prob / 1.8):
            dates.append(current_date)
        else:
            rand_days = random.randint(0, days_range)
            dates.append(start_date + timedelta(days=rand_days))

    dates.sort()
    
    data = []
    for i in range(num_rows):
        order_id = order_ids[i]
        order_date = dates[i]
        
        # Select random customer
        cust_row = customer_df.sample(n=1).iloc[0]
        cust_id = cust_row["Customer ID"]
        cust_name = cust_row["Customer Name"]
        gender = cust_row["Gender"]
        cust_segment = cust_row["Customer Segment"]
        region = cust_row["Region"]
        state = cust_row["State"]
        city = cust_row["City"]
        
        # Select product
        prod = random.choice(products_db)
        category = prod["Category"]
        prod_name = prod["Name"]
        unit_price = prod["Price"]
        base_cost = prod["Cost"]
        
        # Adjust pricing based on gender target slightly (e.g. Beauty products split, etc., but keeping unit price consistent)
        unit_price = round(unit_price * random.uniform(0.97, 1.03), 2)
        base_cost = round(base_cost * random.uniform(0.98, 1.02), 2)
        
        # Quantity
        if cust_segment == "Corporate":
            quantity = random.choices([1, 2, 3, 4, 5, 8, 10], weights=[0.2, 0.2, 0.2, 0.15, 0.15, 0.05, 0.05])[0]
        else:
            quantity = random.choices([1, 2, 3, 4], weights=[0.5, 0.3, 0.15, 0.05])[0]
            
        # Discount %
        discount_prob = random.random()
        if discount_prob < 0.65:
            discount = 0.0
        else:
            discount = random.choice([0.05, 0.10, 0.15, 0.20, 0.25])
            
        # Financial Calculations
        gross_sales = quantity * unit_price
        sales_amount = round(gross_sales * (1 - discount), 2)
        cost_amount = round(quantity * base_cost, 2)
        profit_amount = round(sales_amount - cost_amount, 2)
        profit_margin = round((profit_amount / sales_amount) * 100, 2) if sales_amount > 0 else 0.0
        
        # Operational fields
        pay_method = random.choices(payment_methods, weights=payment_weights)[0]
        ship_mode = random.choices(shipping_modes, weights=shipping_weights)[0]
        deliv_status = random.choices(delivery_statuses, weights=delivery_weights)[0]
        
        data.append([
            order_id, cust_id, cust_name, gender, order_date.strftime("%Y-%m-%d"), 
            region, state, city, category, prod_name, quantity, unit_price, 
            discount, sales_amount, cost_amount, profit_amount, profit_margin,
            pay_method, ship_mode, deliv_status, cust_segment
        ])
        
        if (i+1) % 25000 == 0:
            print(f"Generated {i+1} rows...")
            
    columns = [
        "Order ID", "Customer ID", "Customer Name", "Gender", "Order Date", "Region", "State", "City",
        "Product Category", "Product Name", "Quantity Sold", "Unit Price", "Discount %",
        "Sales Amount", "Cost Amount", "Profit Amount", "Profit Margin %",
        "Payment Method", "Shipping Mode", "Delivery Status", "Customer Segment"
    ]
    
    df = pd.DataFrame(data, columns=columns)
    
    # Introduce some noise/dirty data for cleaning exercise
    print("Introducing dirty data for cleaning practice...")
    
    nan_delivery_idx = df.sample(frac=0.005).index
    df.loc[nan_delivery_idx, "Delivery Status"] = np.nan
    
    nan_payment_idx = df.sample(frac=0.003).index
    df.loc[nan_payment_idx, "Payment Method"] = np.nan
    
    case_idx_1 = df[df["Product Category"] == "Electronics"].sample(frac=0.05).index
    df.loc[case_idx_1, "Product Category"] = "electronics"
    
    case_idx_2 = df[df["Product Category"] == "Home & Kitchen"].sample(frac=0.05).index
    df.loc[case_idx_2, "Product Category"] = "HOME & KITCHEN"
    
    os.makedirs("data", exist_ok=True)
    
    # Save raw data
    raw_path = "data/raw_sales_data.csv"
    df.to_csv(raw_path, index=False)
    
    # Create duplicates at the end
    dup_rows = df.sample(n=75, random_state=42)
    df_with_dups = pd.concat([df, dup_rows], ignore_index=True)
    df_with_dups.to_csv(raw_path, index=False)
    print(f"Raw dataset (with 75 duplicate rows) successfully written to {raw_path}")
    print(f"Final raw dataset shape: {df_with_dups.shape}")

if __name__ == "__main__":
    generate_ecom_dataset()
