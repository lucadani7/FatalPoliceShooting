import os

import pandas as pd
from fastapi import FastAPI, Depends, Header, Request, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin, ModelView
from sqlalchemy import text
from sqlalchemy.orm import Session

import database
import models
from database import engine, get_db

app = FastAPI(title="Police Shootings API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ShootingAdmin(ModelView, model=models.Shooting):
    column_list = [models.Shooting.id, models.Shooting.name, models.Shooting.race, models.Shooting.state]
    column_searchable_list = [models.Shooting.name]
    name_plural = "Police Cases"


admin = Admin(app, engine)
admin.add_view(ShootingAdmin)


models.Base.metadata.create_all(bind=database.engine)

@app.get("/update-database")
def update_database(authorization: str = Header(None), db: Session = Depends(database.get_db)):
    if authorization != f"Bearer {os.getenv('CRON_SECRET')}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        url = "https://raw.githubusercontent.com/washingtonpost/data-police-shootings/master/fatal-police-shootings-data.csv"
        df = pd.read_csv(url)
        db.query(models.Incident).delete()
        for _, row in df.iterrows():
            incident = models.Incident(
                external_id=row['id'],
                name=row['name'],
                date=row['date'],
                race=row['race'] if pd.notnull(row['race']) else 'Unknown',
                city=row['city'],
                state=row['state'],
                armed=row['armed'],
                body_camera=str(row['body_camera']).lower() == 'true'
            )
            db.add(incident)
        db.commit()
        return {"status": "success", "updated_count": len(df)}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}

@app.get("/api/stats")
def get_stats(request: Request, db: Session = Depends(get_db)):
    try:
        state = request.query_params.get('state', 'All')
        table_name = models.Shooting.__tablename__
        if state and state != "All":
            query_sql = text(f"SELECT * FROM {table_name} WHERE state = :state")
            result = db.execute(query_sql, {"state": state})
        else:
            query_sql = text(f"SELECT * FROM {table_name}")
            result = db.execute(query_sql)
        rows = [dict(r) for r in result.mappings()]
        df = pd.DataFrame(rows)
        if df.empty:
            return {"stats": [], "recent_incidents": []}
        df = df.astype(object)
        df = df.where(pd.notnull(df), None)
        df = df.replace({pd.NA: None, float('nan'): None}).where(pd.notnull(df), None)
        df['race'] = df['race'].apply(lambda x: str(x) if str(x).strip() != "" else "None")
        total_count = len(df)
        counts = df['race'].value_counts()
        stats = [
            {
                "race": str(r),
                "count": int(c),
                "percentage": round((int(c) / total_count) * 100, 1)
            } for r, c in counts.items()
        ]
        recent_incidents = df.to_dict(orient="records")
        return jsonable_encoder({
            "stats": stats,
            "recent_incidents": recent_incidents
        })
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        return {"error": str(e), "stats": [], "recent_incidents": []}



@app.get("/stats")
def get_stats_simple(request: Request, db: Session = Depends(get_db)):
    return get_stats(request=request, db=db)


@app.get("/")
def home():
    return {
        "status": "Online",
        "admin": "/admin",
        "docs": "/docs",
        "info": "Use /api/stats for graphics data"
    }

def sync_data_to_supabase():
    CSV_URL = "https://raw.githubusercontent.com/washingtonpost/data-police-shootings/master/fatal-police-shootings-data.csv"
    print(f"Downloading data from: {CSV_URL}")
    try:
        df = pd.read_csv(CSV_URL)
        df = df.dropna(subset=['id'])
        print(f"Loading {len(df)} rows in database...")
        df.to_sql('incidents', con=engine, if_exists='replace', index=False)
        print("Data loaded successfully!")
    except Exception as e:
        print(f"Error while sync: {e}")
        raise e


if __name__ == "__main__":
    sync_data_to_supabase()