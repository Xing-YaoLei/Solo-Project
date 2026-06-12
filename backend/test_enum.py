import enum
from sqlalchemy import Column, Integer, Enum, insert
from sqlalchemy.orm import declarative_base
from sqlalchemy.dialects import postgresql

Base = declarative_base()

class PointStatus(str, enum.Enum):
    ACTIVE = 'active'
    INACTIVE = 'inactive'

class Test(Base):
    __tablename__ = 'test'
    id = Column(Integer, primary_key=True)
    status = Column(Enum(PointStatus))

stmt = insert(Test).values(status=PointStatus.ACTIVE)
compiled = stmt.compile(dialect=postgresql.dialect())
print('Without values_callable:')
print('  SQL:', str(compiled))
print('  Params:', compiled.params)
print('  Status value:', repr(PointStatus.ACTIVE), '-> stored as:', compiled.params.get('status'))

class Test2(Base):
    __tablename__ = 'test2'
    id = Column(Integer, primary_key=True)
    status = Column(Enum(PointStatus, values_callable=lambda x: [e.value for e in x]))

stmt2 = insert(Test2).values(status=PointStatus.ACTIVE)
compiled2 = stmt2.compile(dialect=postgresql.dialect())
print('\nWith values_callable:')
print('  SQL:', str(compiled2))
print('  Params:', compiled2.params)
print('  Status value:', repr(PointStatus.ACTIVE), '-> stored as:', compiled2.params.get('status'))

print('\n--- Conclusion ---')
print('Default Enum(PointStatus) stores:', PointStatus.ACTIVE.name, '(member name)')
print('With values_callable stores:', PointStatus.ACTIVE.value, '(enum value)')
print('PostgreSQL enum values are lowercase, so values_callable is REQUIRED!')
