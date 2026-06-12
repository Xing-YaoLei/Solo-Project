from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models import Person
from app import schemas

router = APIRouter()


@router.get("", response_model=List[schemas.Person])
def list_persons(db: Session = Depends(get_db)):
    return db.query(Person).filter(Person.is_active == True).all()


@router.get("/{person_id}", response_model=schemas.Person)
def get_person(person_id: int, db: Session = Depends(get_db)):
    person = db.query(Person).filter(Person.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="人员不存在")
    return person


@router.post("", response_model=schemas.Person)
def create_person(person_in: schemas.PersonCreate, db: Session = Depends(get_db)):
    person = Person(**person_in.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person
