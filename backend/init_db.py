import pandas as pd
from database import engine
from models import Base


def init():
    print(">>> Dropping old tables...")
    Base.metadata.drop_all(bind=engine)
    print(">>> Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print(">>> Reading CSV file (skipping bad lines)...")
    try:
        df = pd.read_csv('fatal-police-shootings-data.csv',on_bad_lines='skip',encoding='utf-8')
        required_columns = [
            'id', 'name', 'date', 'armed_with', 'age',
            'gender', 'race', 'city', 'state',
            'threat_type', 'flee_status', 'body_camera'
        ]
        existing_cols = [c for c in required_columns if c in df.columns]
        df_filtered = df[existing_cols].copy()
        print(f">>> Importing {len(df_filtered)} rows in Postgres...")
        df_filtered.to_sql('shootings', con=engine, if_exists='append', index=False)
        print("Data filtered and imported successfully!")
    except Exception as e:
        print(f"Error while importing data: {e}")

if __name__ == "__main__":
    init()