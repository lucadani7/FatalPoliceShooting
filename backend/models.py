from sqlalchemy import Column, Integer, String, Boolean, Float, Date
from database import Base

class Shooting(Base):
    __tablename__ = "shootings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    date = Column(Date)
    armed_with = Column(String)
    age = Column(Float)
    gender = Column(String)
    race = Column(String)
    city = Column(String)
    state = Column(String)
    threat_type = Column(String)
    flee_status = Column(String)
    body_camera = Column(Boolean, default=False)


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(Integer)
    name = Column(String)
    date = Column(Date)
    race = Column(String, default="Unknown")
    city = Column(String)
    state = Column(String)
    armed = Column(String)
    body_camera = Column(Boolean)